#!/bin/bash
# OpenClaw Tunnel Setup Script

echo "=== OpenClaw Tunnel Setup ==="
echo ""
echo "This script will expose your OpenClaw gateway for remote access."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "Installing ngrok..."
    curl -sSL https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip -o /tmp/ngrok.zip
    unzip -o /tmp/ngrok.zip -d ~/.local/bin
    chmod +x ~/.local/bin/ngrok
    rm /tmp/ngrok.zip
    echo "ngrok installed."
fi

# Check for ngrok config
if [ ! -f ~/.ngrok2/ngrok.yml ]; then
    echo ""
    echo "IMPORTANT: You need a ngrok account!"
    echo "1. Go to https://ngrok.com and sign up (free)"
    echo "2. Get your authtoken from https://dashboard.ngrok.com/auth"
    echo "3. Run: ngrok authtoken YOUR_TOKEN_HERE"
    echo ""
    read -p "Press enter when you have set up ngrok..."
fi

echo ""
echo "Starting ngrok tunnel to port 18789..."
echo "Keep this terminal open!"
echo ""

# Start ngrok
~/.local/bin/ngrok http 18789 --log=stdout
