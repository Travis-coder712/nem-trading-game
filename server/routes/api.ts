import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { engine } from '../sockets/index.ts';
import { generateQRCodeDataUrl } from '../utils/qrcode.ts';
import { getServerUrl, hasPublicUrl } from '../utils/networkInfo.ts';
import { getPreReadHTML } from '../pages/pre-read.ts';
import { getLearnNemHTML } from '../pages/learn-nem.ts';
import { getTechnicalNotesHTML } from '../pages/technical-notes.ts';
import { getVibeCodingNotesHTML } from '../pages/vibe-coding-notes.ts';
import { listConfigs, saveConfig, deleteConfig } from '../data/configs.ts';
import type { AssetConfigPreset } from '../../shared/types.ts';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

apiRouter.get('/network-info', (req, res) => {
  const port = parseInt(process.env.PORT || '3001');
  const serverUrl = getServerUrl(port);
  res.json({ serverUrl, port, isPublic: hasPublicUrl() });
});

apiRouter.get('/game/:gameId', (req, res) => {
  const game = engine.getGame(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  const snapshot = engine.getSnapshot(game.id);
  res.json(snapshot);
});

apiRouter.get('/game/:gameId/qr', async (req, res) => {
  const game = engine.getGame(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const port = parseInt(process.env.PORT || '3001');
  const serverUrl = getServerUrl(port);
  const joinUrl = `${serverUrl}/team/join?game=${game.id}`;
  const qrDataUrl = await generateQRCodeDataUrl(joinUrl);

  res.json({ qrDataUrl, joinUrl });
});

apiRouter.get('/game/:gameId/export', (req, res) => {
  const game = engine.getGame(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const exportData = {
    gameId: game.id,
    mode: game.config.mode,
    totalRounds: game.config.rounds.length,
    completedRounds: game.currentRound,
    teams: game.teams.map(t => ({
      name: t.name,
      cumulativeProfit: t.cumulativeProfitDollars,
      rank: t.rank,
      roundResults: t.roundResults,
    })),
    roundResults: game.roundResults,
    exportedAt: new Date().toISOString(),
  };

  res.json(exportData);
});

// Pre-read printable page (File > Print > Save as PDF)
apiRouter.get('/pre-read', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getPreReadHTML());
});

// Learn the NEM printable page (File > Print > Save as PDF)
apiRouter.get('/learn-nem', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getLearnNemHTML());
});

// ---- Development Notes ----

apiRouter.get('/notes/technical', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getTechnicalNotesHTML());
});

apiRouter.get('/notes/vibe-coding', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getVibeCodingNotesHTML());
});

// ---- Asset Configuration Presets ----

apiRouter.get('/asset-configs', (req, res) => {
  try {
    const configs = listConfigs();
    res.json({ configs });
  } catch (err) {
    console.error('Error listing asset configs:', err);
    res.json({ configs: [] });
  }
});

apiRouter.post('/asset-configs', (req, res) => {
  try {
    const { name, assets, applyVariation } = req.body;
    if (!name || !assets) {
      return res.status(400).json({ error: 'Missing name or assets' });
    }
    const config: AssetConfigPreset = {
      id: uuidv4().slice(0, 8),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      applyVariation: applyVariation ?? true,
      assets,
    };
    saveConfig(config);
    res.json(config);
  } catch (err) {
    console.error('Error saving asset config:', err);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

apiRouter.delete('/asset-configs/:id', (req, res) => {
  try {
    const deleted = deleteConfig(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting asset config:', err);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

apiRouter.get('/games', (req, res) => {
  // Return info about the first (and typically only) active game
  const game = engine.getFirstGame();
  if (!game) {
    return res.json({ games: [] });
  }
  res.json({
    games: [{
      id: game.id,
      mode: game.config.mode,
      phase: game.phase,
      teamCount: game.teams.length,
      maxTeams: game.config.teamCount,
      currentRound: game.currentRound,
      totalRounds: game.config.rounds.length,
    }],
  });
});
