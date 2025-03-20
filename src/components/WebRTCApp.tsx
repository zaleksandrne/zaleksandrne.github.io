import React, { useEffect, useRef, useState } from "react";

const roomId = "test-room";
const userId = Math.random().toString(36).substr(2, 9);
const ws = new WebSocket(`wss://gorodami.ru/ws/${roomId}/${userId}`);

const WebRTCApp: React.FC = () => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
    const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            ws.onopen = () => {
                ws.send(JSON.stringify({ type: "join", userId }));
            };
        });

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log("🔵 WebSocket message:", data);

            if (data.type === "new-user" && data.userId !== userId) {
                createPeerConnection(data.userId, true);
            } else if (data.type === "offer" && data.to === userId) {
                await handleOffer(data.offer, data.from);
            } else if (data.type === "answer" && data.to === userId) {
                await peerConnections.current[data.from]?.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else if (data.type === "candidate" && data.to === userId) {
                await peerConnections.current[data.from]?.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        return () => ws.close(); // Закрываем WebSocket при размонтировании
    }, []);

    function createPeerConnection(remoteUserId: string, initiator = false) {
        console.log(`🔧 Creating peerConnection for ${remoteUserId}`);

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "turn:82.202.137.205:3478",
                    username: "admin",
                    credential: "adminadmin",
                },
            ],
        });

        peerConnection.ontrack = (event) => {
            setRemoteStreams((prev) => ({ ...prev, [remoteUserId]: event.streams[0] }));
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate, from: userId, to: remoteUserId }));
            }
        };

        peerConnections.current[remoteUserId] = peerConnection;

        if (initiator) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
                stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
                return peerConnection.createOffer();
            }).then((offer) => peerConnection.setLocalDescription(offer)).then(() => {
                ws.send(JSON.stringify({ type: "offer", offer: peerConnection.localDescription, to: remoteUserId, from: userId }));
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

        ws.send(JSON.stringify({ type: "answer", answer, to: from, from: userId }));
    }

    const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

    useEffect(() => {
        Object.keys(remoteStreams).forEach((key) => {
            if (videoRefs.current[key]) {
                videoRefs.current[key]!.srcObject = remoteStreams[key];
            }
        });
    }, [remoteStreams]);

    return (
        <div>
            <h2>Local Video</h2>
            <video ref={localVideoRef} muted autoPlay playsInline />

            <h2>Remote Videos</h2>
            <div>
                {Object.keys(remoteStreams).map((key) => (
                    <video
                        key={key}
                        ref={(el) => {
                            videoRefs.current[key] = el;
                        }}
                        autoPlay
                        playsInline
                    />
                ))}
            </div>
        </div>
    );
};

export default WebRTCApp;
