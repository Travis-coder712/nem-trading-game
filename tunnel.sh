#!/bin/bash
# Start the game server with ngrok tunnel for remote access
# Usage: ./tunnel.sh
#
# Prerequisites: Install ngrok first:
#   brew install ngrok
#   ngrok config add-authtoken YOUR_TOKEN  (get free token at https://dashboard.ngrok.com)

PORT=${PORT:-3001}

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo ""
  echo "  ❌ ngrok is not installed."
  echo ""
  echo "  Install it with:"
  echo "    brew install ngrok"
  echo ""
  echo "  Then sign up for a free account and add your auth token:"
  echo "    https://dashboard.ngrok.com/signup"
  echo "    ngrok config add-authtoken YOUR_TOKEN"
  echo ""
  exit 1
fi

echo ""
echo "  🚀 Starting ngrok tunnel on port $PORT..."
echo ""

# Start ngrok in the background
ngrok http $PORT --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and get the public URL
sleep 3
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PUBLIC_URL" ]; then
  echo "  ❌ Failed to start ngrok tunnel. Check if you have a valid auth token."
  echo "  Run: ngrok config add-authtoken YOUR_TOKEN"
  kill $NGROK_PID 2>/dev/null
  exit 1
fi

echo "  ✅ Tunnel active: $PUBLIC_URL"
echo ""

# Start the game server with the public URL
PUBLIC_URL=$PUBLIC_URL npx tsx server/index.ts &
SERVER_PID=$!

# Handle Ctrl+C gracefully
cleanup() {
  echo ""
  echo "  🛑 Shutting down..."
  kill $SERVER_PID 2>/dev/null
  kill $NGROK_PID 2>/dev/null
  echo "  ✅ Server and tunnel stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait $SERVER_PID $NGROK_PID
