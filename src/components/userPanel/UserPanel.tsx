import { MicOff, Mic, Video, VideoOff } from 'lucide-react';

interface UserPanelProps {
  isMuted: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  isVideoEnabled: boolean;
}

const UserPanel: React.FC<UserPanelProps> = ({
  isMuted,
  toggleMute,
  toggleVideo,
  isVideoEnabled,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
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
        {!isVideoEnabled ? <VideoOff size={24} /> : <Video size={24} />}
      </button>
    </div>
  );
};

export default UserPanel;
