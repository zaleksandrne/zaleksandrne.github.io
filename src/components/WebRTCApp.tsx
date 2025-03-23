import { useEffect, useRef, useState } from 'react';
import UserPanel from './userPanel/UserPanel';
import UsernamePrompt from './usernamePrompt/UsernamePrompt';

const roomId = 'test-room';
const userId = Math.random().toString(36).substr(2, 9);
// const ws = new WebSocket(`wss://gorodami.ru/ws/${roomId}/${userId}`);
const ws = new WebSocket(`wss://192.168.31.131:8008/ws/${roomId}/${userId}`);

const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

export const WebRTCApp = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
  const [isMuted, setIsMuted] = useState(false);
  let localStream: MediaStream;
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const username = localStorage.getItem('chatUsername');

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: isVideoEnabled, audio: !isMuted })
      .then((stream) => {
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
        setTimeout(() => {
          createPeerConnection(data.userId, true);
        }, 600);
      } else if (data.type === 'mute-toggle') {
        const pc = peerConnections.current[data.userId];
        if (pc) {
          setRemoteStreams((prev) => {
            const newStreams = { ...prev };
            newStreams[data.userId]?.getAudioTracks().forEach((track) => {
              track.enabled = !data.isMuted;
            });
            return newStreams;
          });
        }
      } else if (data.type === 'video-toggle') {
        const pc = peerConnections.current[data.userId];
        if (pc) {
          setRemoteStreams((prev) => {
            const newStreams = { ...prev };
            newStreams[data.userId]?.getVideoTracks().forEach((track) => {
              track.enabled = data.videoEnabled;
            });
            return newStreams;
          });
        }
      } else if (data.type === 'offer' && data.to === userId) {
        await handleOffer(data.offer, data.from);
      } else if (data.type === 'answer' && data.to === userId) {
        const pc = peerConnections.current[data.from];
        if (pc && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (error) {
            console.error('Failed to set remote answer:', error);
          }
        }
      } else if (data.type === 'candidate' && data.to === userId) {
        await delay(500);
        await peerConnections.current[data.from]?.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
      } else if (data.type === 'user-disconnected' && data.userId !== userId) {
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[data.userId];
          return newStreams;
        });
      }
    };

    return () => ws.close();
  }, []);

  // if (!username) {
  //   return <UsernamePrompt />;
  // }

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
        .getUserMedia({ video: isVideoEnabled, audio: !isMuted })
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

  const toggleMute = async () => {
    const newState = !isMuted;
    setIsMuted(newState);

    ws.send(
      JSON.stringify({
        type: 'mute-toggle',
        userId,
        isMuted: newState,
      }),
    );
  };

  const toggleVideo = async () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);

    ws.send(
      JSON.stringify({
        type: 'video-toggle',
        userId,
        videoEnabled: newState,
      }),
    );
  };

  return (
    <div className="h-screen bg-black flex flex-col justify-between p-4">
      <div className="flex flex-grow flex-wrap justify-center items-center gap-4 mb-4">
        <div className="flex justify-center items-center border-4 border-blue-500 rounded-lg shadow-lg">
          <video
            style={{ opacity: isVideoEnabled ? 1 : 0 }}
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
            className="w-80 h-48"
          />
        </div>

        {Object.keys(remoteStreams).map((key) => (
          <div
            key={key}
            className="flex justify-center items-center border-2 border-gray-700 rounded-lg shadow-md"
          >
            <video
              ref={(el) => {
                if (el) el.srcObject = remoteStreams[key];
              }}
              autoPlay
              playsInline
              className="w-80 h-48"
            />
          </div>
        ))}
      </div>

      <UserPanel
        isVideoEnabled={isVideoEnabled}
        isMuted={isMuted}
        toggleMute={toggleMute}
        toggleVideo={toggleVideo}
      />
    </div>
  );
};
