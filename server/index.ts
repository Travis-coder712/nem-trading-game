import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { setupSocketHandlers } from './sockets/index.ts';
import { apiRouter } from './routes/api.ts';
import { getLocalIPAddress, getServerUrl, hasPublicUrl } from './utils/networkInfo.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true, // Allow all origins (needed for ngrok/tunnel access)
    methods: ['GET', 'POST'],
  },
  // Tolerant settings for flaky connections (hotspot, mobile, etc.)
  // Ping every 10s, wait up to 30s for a response before declaring dead
  pingInterval: 10000,
  pingTimeout: 30000,
  // Allow large payloads for later rounds with more accumulated data
  maxHttpBufferSize: 5e6, // 5MB
});

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

// Serve the built React app
// When running via tsx from project root: dist/client
// When running compiled JS from dist/server: ../client
const clientDistPath = path.resolve(
  path.join(__dirname, '../client').includes('dist')
    ? path.join(__dirname, '../client')
    : path.join(process.cwd(), 'dist/client')
);
app.use(express.static(clientDistPath));

// Catch-all for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return;
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // In dev mode, client is served by Vite, not Express
      res.status(200).send('<!-- Client served by Vite dev server -->');
    }
  });
});

// Setup socket event handlers
setupSocketHandlers(io);

const PORT = parseInt(process.env.PORT || '3001');
const TUNNEL = process.argv.includes('--tunnel');

httpServer.listen(PORT, '0.0.0.0', async () => {
  const localIP = getLocalIPAddress();

  console.log('');
  console.log('  ⚡ Watt Street — Bid. Dispatch. Dominate.');
  console.log('  ══════════════════════════════════════════');
  console.log(`  Host Dashboard:  http://localhost:${PORT}`);
  console.log(`  Network URL:     http://${localIP}:${PORT}`);

  // If --tunnel flag is passed, auto-start ngrok
  if (TUNNEL) {
    try {
      const ngrok = await import('ngrok');
      const publicUrl = await ngrok.default.connect(PORT);
      process.env.PUBLIC_URL = publicUrl;
      console.log(`  🌐 Public URL:   ${publicUrl}`);
      console.log(`  🌐 Team Join:    ${publicUrl}/team/join`);
      console.log('  ════════════════════════════════════');
      console.log('  🌐 Public tunnel active — share the link with anyone!');
      console.log('  Press Ctrl+C to stop the server and close the tunnel.');
    } catch (err: any) {
      console.log('  ════════════════════════════════════');
      console.log(`  ⚠️  Tunnel failed: ${err.message}`);
      if (err.message?.includes('authtoken')) {
        console.log('');
        console.log('  To set up ngrok (one-time):');
        console.log('  1. Sign up free at https://dashboard.ngrok.com/signup');
        console.log('  2. Copy your auth token from the dashboard');
        console.log('  3. Run: npx ngrok config add-authtoken YOUR_TOKEN');
        console.log('  4. Then restart with: npm run tunnel');
      }
      console.log('');
      console.log('  Server is still running on local network.');
    }
  } else if (hasPublicUrl()) {
    const serverUrl = getServerUrl(PORT);
    console.log(`  🌐 Public URL:   ${serverUrl}`);
    console.log(`  🌐 Team Join:    ${serverUrl}/team/join`);
    console.log('  ════════════════════════════════════');
    console.log('  🌐 Public tunnel active — anyone with the link can join!');
  } else {
    const serverUrl = getServerUrl(PORT);
    console.log(`  Team Join URL:   ${serverUrl}/team/join`);
    console.log('  ════════════════════════════════════');
    console.log('  Teams scan the QR code on the host dashboard to join.');
    console.log('  💡 For remote access run: npm run tunnel');
  }

  console.log('');
});

// Global error handlers — prevent crashes from killing the server
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught exception (server kept running):', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled rejection (server kept running):', reason);
});

// Graceful shutdown - close ngrok tunnel
process.on('SIGINT', async () => {
  if (TUNNEL) {
    try {
      const ngrok = await import('ngrok');
      await ngrok.default.disconnect();
      await ngrok.default.kill();
    } catch {}
  }
  process.exit(0);
});
