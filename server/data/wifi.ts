/**
 * File-based persistence for WiFi configuration.
 * Stored as a single JSON file that survives server restarts.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'configs');
const WIFI_FILE = path.join(DATA_DIR, '_wifi.json');

export interface WifiConfig {
  networkName: string;
  password: string;
  /** Optional: 'WPA' | 'WEP' | 'nopass' — defaults to 'WPA' */
  encryption?: string;
  updatedAt: string;
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getWifiConfig(): WifiConfig | null {
  ensureDir();
  if (!existsSync(WIFI_FILE)) return null;
  try {
    const data = readFileSync(WIFI_FILE, 'utf-8');
    return JSON.parse(data) as WifiConfig;
  } catch {
    return null;
  }
}

export function saveWifiConfig(config: WifiConfig): void {
  ensureDir();
  writeFileSync(WIFI_FILE, JSON.stringify(config, null, 2));
}

export function deleteWifiConfig(): boolean {
  ensureDir();
  if (existsSync(WIFI_FILE)) {
    unlinkSync(WIFI_FILE);
    return true;
  }
  return false;
}

/**
 * Generate a WiFi QR code string in the standard WIFI: format.
 * When scanned by a phone camera, it auto-connects to the network.
 * Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;;
 */
export function generateWifiQRString(config: WifiConfig): string {
  const enc = config.encryption || 'WPA';
  // Escape special chars in SSID and password
  const escapeWifi = (s: string) => s.replace(/[\\;,":\s]/g, c => `\\${c}`);
  return `WIFI:T:${enc};S:${escapeWifi(config.networkName)};P:${escapeWifi(config.password)};;`;
}
