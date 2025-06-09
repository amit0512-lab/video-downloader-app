const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR);

const BASE_URL = 'https://video-downloader-app-2h3c.onrender.com';
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');
const SESSION_PATH = path.join(__dirname, 'insta-session.txt');

// Convert to Android-safe MP4 using FFmpeg
function convertToAndroidMP4(inputPath, outputPath, callback) {
  const cmd = `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`;
  exec(cmd, callback);
}

app.post('/api/download', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const timestamp = Date.now();
  const filename = `video_${timestamp}.mp4`;
  const filepath = path.join(DOWNLOADS_DIR, filename);
  let command = '';

  // --- YouTube ---
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    command = `yt-dlp --no-playlist --cookies "${COOKIES_PATH}" --remux-video mp4 -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -o "${filepath}" "${url}"`;
  }

  // --- Instagram ---
  else if (url.includes('instagram.com')) {
    const cleanUrl = url.split('?')[0];
    const match = cleanUrl.match(/\/reel\/([a-zA-Z0-9_-]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid Instagram reel URL' });

    const shortcode = match[1];
    const instaFolder = path.join(DOWNLOADS_DIR, `insta_${timestamp}`);
    if (!fs.existsSync(instaFolder)) fs.mkdirSync(instaFolder);

    command = `instaloader --sessionfile "${SESSION_PATH}" --no-metadata-json --no-compress-json --no-captions --dirname-pattern "${instaFolder}" --filename-pattern "video" -- -${shortcode}`;
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

      const originalPath = path.join(fullInstaPath, videoFile);
      const finalPath = path.join(DOWNLOADS_DIR, filename);

      // Convert to Android-compatible format
      convertToAndroidMP4(originalPath, finalPath, (ffmpegErr) => {
        if (ffmpegErr) {
          console.error('❌ FFmpeg Error:', ffmpegErr.message);
          return res.status(500).json({ error: 'Video conversion failed', details: ffmpegErr.message });
        }

        fs.rmSync(fullInstaPath, { recursive: true, force: true });
        return res.json({ downloadUrl: `${BASE_URL}/downloads/${filename}` });
      });

    } else {
      // YouTube: return final URL directly
      return res.json({ downloadUrl: `${BASE_URL}/downloads/${filename}` });
    }
  });
});

// Force download with correct headers
app.get('/downloads/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(DOWNLOADS_DIR, file);
  if (fs.existsSync(filePath)) {
    res.download(filePath); // force browser to download
  } else {
    res.status(404).send('File not found');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
