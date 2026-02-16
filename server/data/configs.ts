/**
 * File-based persistence for saved asset configuration presets.
 * Configs are stored as individual JSON files in server/data/configs/.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AssetConfigPreset } from '../../shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIGS_DIR = path.join(__dirname, 'configs');

function ensureDir() {
  if (!existsSync(CONFIGS_DIR)) {
    mkdirSync(CONFIGS_DIR, { recursive: true });
  }
}

export function listConfigs(): AssetConfigPreset[] {
  ensureDir();
  const files = readdirSync(CONFIGS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = readFileSync(path.join(CONFIGS_DIR, f), 'utf-8');
    return JSON.parse(data) as AssetConfigPreset;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveConfig(config: AssetConfigPreset): void {
  ensureDir();
  writeFileSync(
    path.join(CONFIGS_DIR, `${config.id}.json`),
    JSON.stringify(config, null, 2)
  );
}

export function deleteConfig(id: string): boolean {
  ensureDir();
  // Sanitise the id to prevent directory traversal
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(CONFIGS_DIR, `${safeId}.json`);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
    return true;
  }
  return false;
}
