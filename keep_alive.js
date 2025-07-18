const express = require('express');
const { checkBotHealth } = require('./health_check');
const app = express();

// Middleware pour prévenir les erreurs 502
app.use((req, res, next) => {
  // Timeout global pour éviter les requêtes qui traînent
  res.setTimeout(10000, () => {
    console.log('⚠️ Timeout requête détecté, fermeture connexion');
    if (!res.headersSent) {
      res.status(504).json({ error: 'Gateway timeout' });
    }
    res.end();
  });
  
  // Headers de sécurité
  res.setHeader('Server', 'Discord-Bot-KeepAlive/2.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
});

// Données de statut du bot
let botStatus = {
  startTime: Date.now(),
  lastPing: Date.now(),
  uptime: 0,
  status: 'online',
  version: '2.0.0',
  environment: process.env.NODE_ENV || 'production'
};

// Middleware pour CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Endpoint principal pour UptimeRobot avec protection 502
app.get('/', (req, res) => {
  try {
    botStatus.lastPing = Date.now();
    botStatus.uptime = Date.now() - botStatus.startTime;
    
    const response = {
      message: 'Bot Discord actif et opérationnel',
      status: botStatus.status,
      uptime: Math.floor(botStatus.uptime / 1000),
      lastPing: new Date(botStatus.lastPing).toISOString(),
      version: botStatus.version,
      environment: botStatus.environment,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur endpoint principal:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Service temporairement indisponible'
    });
  }
});

// Endpoint de ping simple pour UptimeRobot
app.get('/ping', (req, res) => {
  try {
    botStatus.lastPing = Date.now();
    res.status(200).send('pong');
  } catch (error) {
    console.error('Erreur endpoint ping:', error);
    res.status(500).send('error');
  }
});

// Endpoint de santé détaillé avec vérifications automatiques
app.get('/health', (req, res) => {
  botStatus.lastPing = Date.now();
  botStatus.uptime = Date.now() - botStatus.startTime;
  
  try {
    // Obtenir les données de santé détaillées
    const botHealthData = checkBotHealth();
    
    const healthData = {
      status: 'healthy',
      uptime: Math.floor(botStatus.uptime / 1000),
      uptimeFormatted: formatUptime(botStatus.uptime),
      lastPing: new Date(botStatus.lastPing).toISOString(),
      startTime: new Date(botStatus.startTime).toISOString(),
      version: botStatus.version,
      environment: botStatus.environment,
      memoryUsage: process.memoryUsage(),
      processUptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      // Ajouter les vérifications automatiques
      fileChecks: botHealthData.checks.dataFiles,
      memoryDetails: botHealthData.checks.memory
    };
    
    res.status(200).json(healthData);
  } catch (error) {
    console.error('Erreur endpoint health:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service temporarily unavailable',
      error: error.message
    });
  }
});

// Endpoint de statut pour UptimeRobot
app.get('/status', (req, res) => {
  try {
    botStatus.lastPing = Date.now();
    res.status(200).json({
      online: true,
      status: botStatus.status,
      uptime: Math.floor(botStatus.uptime / 1000),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Erreur endpoint status:', error);
    res.status(500).json({
      online: false,
      error: 'Service error'
    });
  }
});

// Endpoint pour mettre à jour le statut du bot
app.post('/update-status', (req, res) => {
  const { status } = req.body;
  if (status && ['online', 'offline', 'maintenance'].includes(status)) {
    botStatus.status = status;
    res.status(200).json({ message: 'Statut mis à jour', status: botStatus.status });
  } else {
    res.status(400).json({ error: 'Statut invalide' });
  }
});

// Endpoint pour les métriques
app.get('/metrics', (req, res) => {
  try {
    botStatus.lastPing = Date.now();
    botStatus.uptime = Date.now() - botStatus.startTime;
    
    const metrics = {
      uptime_seconds: Math.floor(botStatus.uptime / 1000),
      memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      cpu_usage: process.cpuUsage(),
      process_id: process.pid,
      node_version: process.version,
      last_ping: botStatus.lastPing,
      requests_count: req.app.get('requestCount') || 0
    };
    
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Erreur endpoint metrics:', error);
    res.status(500).json({
      error: 'Metrics unavailable'
    });
  }
});

// Middleware pour compter les requêtes
app.use((req, res, next) => {
  const currentCount = req.app.get('requestCount') || 0;
  req.app.set('requestCount', currentCount + 1);
  next();
});

// Fonction pour formater l'uptime
function formatUptime(uptime) {
  const seconds = Math.floor(uptime / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let result = '';
  if (days > 0) result += `${days}j `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${remainingSeconds}s`;
  
  return result.trim();
}

// Ping périodique pour maintenir l'activité
setInterval(() => {
  botStatus.uptime = Date.now() - botStatus.startTime;
  console.log(`[Keep-Alive] Bot actif - Uptime: ${formatUptime(botStatus.uptime)}`);
  
  // Ping interne pour maintenir la connexion
  try {
    const http = require('http');
    const req = http.get('http://localhost:3000/ping', (res) => {
      console.log(`[Keep-Alive] Self-ping réussi: ${res.statusCode}`);
    });
    req.on('error', (err) => {
      console.error(`[Keep-Alive] Self-ping échoué:`, err.message);
    });
    req.setTimeout(5000);
  } catch (error) {
    console.error(`[Keep-Alive] Erreur self-ping:`, error);
  }
}, 240000); // Toutes les 4 minutes

// Ping externe simulé toutes les 30 secondes
setInterval(() => {
  try {
    // Simuler une activité réseau
    const https = require('https');
    https.get('https://discord.com/api/v10/gateway', (res) => {
      // Juste pour maintenir la connexion active
    }).on('error', () => {
      // Ignorer les erreurs, c'est juste pour maintenir l'activité
    });
  } catch (error) {
    // Ignorer les erreurs
  }
}, 30000);

// Fonction keep-alive principale
function keepAlive() {
  const PORT = process.env.KEEP_ALIVE_PORT || 3000;
  
  // Gestion d'erreur globale pour le serveur
  app.use((error, req, res, next) => {
    console.error('Erreur serveur globale:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Le serveur a rencontré une erreur'
      });
    }
  });
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur keep-alive actif sur le port ${PORT}`);
    console.log(`🔗 Endpoints disponibles :`);
    console.log(`   - http://localhost:${PORT}/           (Statut principal)`);
    console.log(`   - http://localhost:${PORT}/ping       (Ping simple)`);
    console.log(`   - http://localhost:${PORT}/health     (Santé détaillée)`);
    console.log(`   - http://localhost:${PORT}/status     (Statut JSON)`);
    console.log(`   - http://localhost:${PORT}/metrics    (Métriques)`);
    console.log(`🤖 Prêt pour UptimeRobot monitoring`);
  });

  // Gestion d'erreur serveur
  server.on('error', (error) => {
    console.error('Erreur serveur keep-alive:', error);
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} occupé, tentative redémarrage...`);
      setTimeout(() => {
        server.close();
        keepAlive();
      }, 5000);
    }
  });

  return server;
}

// Fonction pour mettre à jour le statut depuis l'extérieur
function updateStatus(status) {
  botStatus.status = status;
  botStatus.lastPing = Date.now();
}

// Fonction pour obtenir le statut actuel
function getStatus() {
  return {
    ...botStatus,
    uptime: Date.now() - botStatus.startTime,
    uptimeFormatted: formatUptime(Date.now() - botStatus.startTime)
  };
}

module.exports = {
  keepAlive,
  updateStatus,
  getStatus
};