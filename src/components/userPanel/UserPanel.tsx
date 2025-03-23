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
    <div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-6
                    bg-gray-700/30 backdrop-blur-md p-4 rounded-2xl shadow-lg"
    >
      <button
        onClick={toggleMute}
        className="p-3 bg-gray-800/70 text-white rounded-full shadow-md
                   hover:bg-gray-700 transition-all duration-300"
      >
        {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
      </button>
      <button
        onClick={toggleVideo}
        className="p-3 bg-gray-800/70 text-white rounded-full shadow-md
                   hover:bg-gray-700 transition-all duration-300"
      >
        {!isVideoEnabled ? <VideoOff size={28} /> : <Video size={28} />}
      </button>
    </div>
  );
};

export default UserPanel;
