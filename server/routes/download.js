// routes/download.js
const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "No URL provided" });

  // Distinguish between YouTube and Instagram
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isInstagram = url.includes("instagram.com");

  const downloadsPath = path.join(__dirname, "..", "downloads");
  if (!fs.existsSync(downloadsPath)) fs.mkdirSync(downloadsPath);

  const timestamp = Date.now();
  const outputPath = path.join(downloadsPath, `video_${timestamp}.mp4`);

  if (isYouTube) {
    // yt-dlp command
    const command = `yt-dlp -f best -o "${outputPath}" "${url}"`;
    exec(command, (error) => {
      if (error) return res.status(500).json({ error: "YouTube download failed" });
      res.download(outputPath);
    });

  } else if (isInstagram) {
    // Extract shortcode from Instagram URL
    const match = url.match(/\/reel\/([a-zA-Z0-9_-]+)/);
    if (!match) return res.status(400).json({ error: "Invalid Instagram reel URL" });
    const shortcode = match[1];

    // Run instaloader with session file
    const command = `instaloader --sessionfile server/insta-session.txt --no-metadata-json --no-compress-json --no-captions --dirname-pattern "${downloadsPath}" --filename-pattern "video_${timestamp}" https://www.instagram.com/reel/${shortcode}/`;

    exec(command, (error) => {
      if (error) return res.status(500).json({ error: "Instagram download failed" });
      res.download(path.join(downloadsPath, `video_${timestamp}.mp4`));
    });

  } else {
    return res.status(400).json({ error: "Unsupported platform" });
  }
});

module.exports = router;
