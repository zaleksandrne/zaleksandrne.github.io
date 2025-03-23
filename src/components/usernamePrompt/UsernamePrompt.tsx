import { useState } from 'react';

const UsernamePrompt = () => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      localStorage.setItem('chatUsername', name);
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900/80 p-6 rounded-xl shadow-lg text-white text-center w-80">
        <h2 className="text-xl font-semibold mb-4">Введите ваше имя</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ваше имя..."
        />
        <button
          onClick={handleSave}
          className="mt-4 w-full p-2 bg-blue-600 rounded-md hover:bg-blue-500 transition"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
};

export default UsernamePrompt;
