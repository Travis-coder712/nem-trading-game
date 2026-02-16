import { Router } from 'express';
import { engine } from '../sockets/index.ts';
import { generateQRCodeDataUrl } from '../utils/qrcode.ts';
import { getServerUrl, hasPublicUrl } from '../utils/networkInfo.ts';
import { getPreReadHTML } from '../pages/pre-read.ts';

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
