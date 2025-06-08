const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR);

const BASE_URL = 'https://video-downloader-app-2h3c.onrender.com';

app.post('/api/download', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const timestamp = Date.now();
  const filename = `video_${timestamp}.mp4`;
  const filepath = path.join(DOWNLOADS_DIR, filename);
  let command = '';

  // --- YouTube ---
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    command = `yt-dlp --no-playlist --cookies server/cookies.txt --remux-video mp4 -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -o "${filepath}" "${url}"`;
  }

  // --- Instagram ---
  else if (url.includes('instagram.com')) {
    const cleanUrl = url.split('?')[0];
    const match = cleanUrl.match(/\/reel\/([a-zA-Z0-9_-]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid Instagram reel URL' });

    const shortcode = match[1];
    const instaFolder = path.join(DOWNLOADS_DIR, `insta_${timestamp}`);
    if (!fs.existsSync(instaFolder)) fs.mkdirSync(instaFolder);

    command = `instaloader --sessionfile server/insta-session.txt --no-metadata-json --no-compress-json --no-captions --dirname-pattern "${instaFolder}" --filename-pattern "video" -- -${shortcode}`;
  }

  else {
    return res.status(400).json({ error: 'Unsupported URL' });
  }

  console.log(`📦 Running: ${command}`);

  exec(command, (error, stdout, stderr) => {
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    if (error) {
      console.error('❌ Exec Error:', error.message);
      return res.status(500).json({ error: 'Download failed. Check URL or session.', details: stderr });
    }

    // Instagram post-processing
    if (url.includes('instagram.com')) {
      const instaFolderName = fs.readdirSync(DOWNLOADS_DIR).find(f =>
        f.startsWith(`insta_${timestamp}`) && fs.statSync(path.join(DOWNLOADS_DIR, f)).isDirectory()
      );

      if (!instaFolderName) return res.status(500).json({ error: 'Instagram folder not found' });

      const fullInstaPath = path.join(DOWNLOADS_DIR, instaFolderName);
      const videoFile = fs.readdirSync(fullInstaPath).find(f => f.endsWith('.mp4'));

      if (!videoFile) return res.status(500).json({ error: 'No video found after Instagram download' });

      const finalPath = path.join(DOWNLOADS_DIR, filename);
      fs.renameSync(path.join(fullInstaPath, videoFile), finalPath);
      fs.rmSync(fullInstaPath, { recursive: true, force: true });

      return res.json({ downloadUrl: `${BASE_URL}/downloads/${filename}` });
    } else {
      return res.json({ downloadUrl: `${BASE_URL}/downloads/${filename}` });
    }
  });
});

// Serve static files with correct headers
app.get('/downloads/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(DOWNLOADS_DIR, file);
  if (fs.existsSync(filePath)) {
    res.download(filePath); // Force download
  } else {
    res.status(404).send('File not found');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
