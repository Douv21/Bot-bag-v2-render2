# Discord Bot Deployment Guide

## Overview
This Discord bot can be deployed in multiple ways depending on your hosting environment.

## Deployment Options

### 1. Replit Static Deployment (Current Setup)
- **Status**: ✅ Fixed and Ready
- **Public Directory**: `BAG v2/`
- **Purpose**: Serves a landing page for the bot
- **Access**: Static website with bot information

### 2. Replit Autoscale Deployment (Recommended) ⭐
- **Configuration**: Modifiez `.replit` selon `AUTOSCALE_DEPLOYMENT.md`
- **Purpose**: Full Discord bot functionality with scaling automatique
- **Scaling**: 1-2 instances automatiques selon la charge
- **Health Check**: `/health` endpoint robuste sur port 3000
- **Script optimisé**: `production_start.js` pour démarrage production

### 3. Docker Deployment
- **Configuration**: `Dockerfile` and `.dockerignore`
- **Purpose**: Containerized deployment
- **Ports**: 3000 (health), 5000 (web panel)

## Environment Variables Required

```bash
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
DATABASE_URL=your_postgresql_database_url
```

## Deployment Commands

### For Autoscale Deployment:
```bash
# Set environment variables in Replit Secrets
# Deploy using Replit's autoscale deployment
```

### For Docker Deployment:
```bash
docker build -t discord-confession-bot .
docker run -d -p 3000:3000 -p 5000:5000 \
  -e DISCORD_TOKEN="your_token" \
  -e CLIENT_ID="your_client_id" \
  -e DATABASE_URL="your_db_url" \
  discord-confession-bot
```

## Health Checks
- **Health Endpoint**: `GET /health`
- **Status Endpoint**: `GET /status`
- **Ping Endpoint**: `GET /ping`
- **Metrics Endpoint**: `GET /metrics`

## File Structure for Deployment

### Static Deployment (`BAG v2/`)
```
BAG v2/
├── index.html      # Landing page
├── robots.txt      # SEO robots file
├── sitemap.xml     # Site map
└── manifest.json   # Web app manifest
```

### Application Files (for autoscale/docker)
```
├── index.js                # Main bot entry point
├── server.js              # Web server
├── commands/              # Discord commands
├── utils/                 # Utility modules
├── panel/                 # Web admin panel
├── data/                  # JSON data storage
└── config.json           # Bot configuration
```

## Troubleshooting

### Common Issues:
1. **"Public directory 'BAG v2' does not exist"**
   - ✅ Fixed: Directory created with proper static files

2. **Port conflicts**
   - Bot uses port 3000 for health checks
   - Web panel uses port 5000
   - Ensure ports are not conflicting

3. **Missing environment variables**
   - Ensure all required secrets are set in Replit
   - Check DATABASE_URL format for PostgreSQL

## Deployment Status
- ✅ Static deployment files created
- ✅ Landing page with bot status
- ✅ SEO files (robots.txt, sitemap.xml)
- ✅ Alternative deployment configurations
- ✅ Docker support added
- ✅ Health check endpoints available

## Next Steps
1. Use Replit's deployment interface to switch from static to autoscale
2. Set required environment variables in Replit Secrets
3. Deploy using the autoscale option for full bot functionality