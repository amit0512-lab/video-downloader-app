#!/usr/bin/env bash
apt-get update && apt-get install -y ffmpeg
apt-get install -y curl python3-pip
pip3 install -U yt-dlp
pip3 install instaloader
