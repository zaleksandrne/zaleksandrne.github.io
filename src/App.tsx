import React from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_ROOM_ID = 'default-room';

const App: React.FC = () => {
  const navigate = useNavigate();

  const createRoom = () => {
    console.log('Создание комнаты (на самом деле фиксированная)');
    navigate(`/room/${DEFAULT_ROOM_ID}`);
  };

  const joinRoom = () => {
    console.log('Подключение к комнате (на самом деле фиксированная)');
    navigate(`/room/${DEFAULT_ROOM_ID}`);
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-8 p-6">
      <button
        className="w-[80%] max-w-[600px] bg-gray-900 text-white text-4xl font-bold py-10 rounded-2xl shadow-lg transition-all hover:bg-gray-800 active:scale-95 border border-gray-700"
        onClick={createRoom}
      >
        Создать комнату
      </button>
      <button
        className="w-[80%] max-w-[600px] bg-gray-900 text-white text-4xl font-bold py-10 rounded-2xl shadow-lg transition-all hover:bg-gray-800 active:scale-95 border border-gray-700"
        onClick={joinRoom}
      >
        Войти в комнату
      </button>
    </div>
  );
};

export default App;
