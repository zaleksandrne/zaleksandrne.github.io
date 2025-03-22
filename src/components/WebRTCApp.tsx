import React, { useEffect, useRef, useState } from 'react';
import { MicOff, Mic, Video, VideoOff } from 'lucide-react';

const roomId = 'test-room';
const userId = Math.random().toString(36).substr(2, 9);
const ws = new WebSocket(`wss://gorodami.ru/ws/${roomId}/${userId}`);
// const ws = new WebSocket(`ws://127.0.0.1:8009/ws/${roomId}/${userId}`);

export const WebRTCApp: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  let localStream: MediaStream;

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStream = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', userId }));
      };
    });

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('🔵 WebSocket message:', data);

      if (data.type === 'new-user' && data.userId !== userId) {
        // timeout to fix setRemoteDescriptions
        setTimeout(() => {
          createPeerConnection(data.userId, true);
        }, 300);
      } else if (data.type === 'offer' && data.to === userId) {
        await handleOffer(data.offer, data.from);
      } else if (data.type === 'answer' && data.to === userId) {
        await peerConnections.current[data.from]?.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
      } else if (data.type === 'candidate' && data.to === userId) {
        await peerConnections.current[data.from]?.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
      }
    };

    return () => ws.close();
  }, []);

  function createPeerConnection(remoteUserId: string, initiator = false) {
    console.log(`🔧 Creating peerConnection for ${remoteUserId}`);

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'turn:82.202.137.205:3478',
          username: 'admin',
          credential: 'adminadmin',
        },
      ],
    });

    peerConnection.ontrack = (event) => {
      setRemoteStreams((prev) => ({ ...prev, [remoteUserId]: event.streams[0] }));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
            from: userId,
            to: remoteUserId,
          }),
        );
      }
    };

    peerConnections.current[remoteUserId] = peerConnection;

    if (initiator) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
          return peerConnection.createOffer();
        })
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          ws.send(
            JSON.stringify({
              type: 'offer',
              offer: peerConnection.localDescription,
              to: remoteUserId,
              from: userId,
            }),
          );
        });
    }
  }

  async function handleOffer(offer: RTCSessionDescriptionInit, from: string) {
    console.log(`🎥 Accepting offer from ${from}`);

    if (!peerConnections.current[from]) {
      createPeerConnection(from, false);
    }

    const peerConnection = peerConnections.current[from];
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    ws.send(JSON.stringify({ type: 'answer', answer, to: from, from: userId }));
  }

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => (track.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => (track.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-wrap justify-center items-center gap-4 p-4">
      <div className="relative">
        <video
          ref={localVideoRef}
          muted
          autoPlay
          playsInline
          className="w-80 h-48 border-4 border-blue-500 rounded-lg shadow-lg"
        />
        <div className="absolute bottom-2 left-2 flex gap-2">
          <button
            onClick={toggleMute}
            className="p-2 bg-gray-800 text-white rounded-full shadow-md hover:bg-gray-700 transition"
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <button
            onClick={toggleVideo}
            className="p-2 bg-gray-800 text-white rounded-full shadow-md hover:bg-gray-700 transition"
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        </div>
      </div>
      {Object.keys(remoteStreams).map((key) => (
        <video
          key={key}
          ref={(el) => {
            if (el) el.srcObject = remoteStreams[key];
          }}
          autoPlay
          playsInline
          className="w-80 h-48 border-2 border-gray-700 rounded-lg shadow-md"
        />
      ))}
    </div>
  );
};
