#!/usr/bin/env bash

# Update system packages
apt-get update

# Install Python and pip
apt-get install -y curl python3-pip

# Install yt-dlp and instaloader
pip3 install -U yt-dlp
pip3 install instaloader
