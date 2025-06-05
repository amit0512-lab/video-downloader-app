import { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('');

  const detectPlatform = (url) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
    if (url.includes("instagram.com")) return "Instagram";
    return "Unknown";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const detected = detectPlatform(url);
    setPlatform(detected);
    alert(`Detected platform: ${detected}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-800 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">🎥 InstaTube Downloader</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white p-6 rounded-lg shadow-lg text-black">
        <label className="block mb-2 text-lg font-medium">Paste Video URL (YouTube or Instagram)</label>
        <input
          type="text"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
        >
          Detect & Continue
        </button>
        {platform && <p className="mt-4 text-center font-semibold">Platform: {platform}</p>}
      </form>
    </div>
  );
}

export default App;
