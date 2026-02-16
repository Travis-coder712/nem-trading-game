import os from 'os';

export function getLocalIPAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

export function getServerUrl(port: number): string {
  // If PUBLIC_URL is set (e.g. from ngrok), use that for QR codes and join links
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL.replace(/\/$/, ''); // strip trailing slash
  }
  const ip = getLocalIPAddress();
  return `http://${ip}:${port}`;
}

/**
 * Returns true if the server is accessible via a public tunnel (ngrok, cloudflare, etc.)
 */
export function hasPublicUrl(): boolean {
  return !!process.env.PUBLIC_URL;
}
