# WhatsApp Dashboard - OpenClaw

A web dashboard to manage your WhatsApp connection via OpenClaw.

## Setup

1. **Gateway Connection**: By default, this dashboard connects to a local OpenClaw gateway at `ws://localhost:18789`

2. **For Remote Access**: You have two options:

   **Option A - Use a Tunnel (Recommended for quick setup)**:
   ```bash
   # Install ngrok
   brew install ngrok  # or download from ngrok.com
   
   # Expose your local gateway
   ngrok http 18789
   ```
   Then update the Gateway URL in settings to your ngrok URL.

   **Option B - Deploy Gateway to Azure**:
   - SSH to your Azure VM (20.98.240.210)
   - Install and run OpenClaw gateway
   - Update the NSG to allow port 18789

## Deploy to GitHub Pages

1. Fork this repository
2. Go to Settings → Pages
3. Source: Deploy from branch
4. Branch: main, folder: /dist
5. Save

## Deploy to Azure Static Web Apps

1. Create a Static Web App in Azure Portal
2. Connect to your GitHub repository
3. Build preset: Vite
4. App location: /
5. Output location: dist
