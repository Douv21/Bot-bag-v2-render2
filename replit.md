# Discord Anonymous Confession Bot

## Overview

This is a Discord bot built with Discord.js v14 that allows users to submit anonymous confessions through slash commands. The bot supports both text and image confessions, implements rate limiting to prevent spam, and maintains audit logs for moderation purposes.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: French (user communicates in French)

## System Architecture

### Frontend Architecture
- **Discord Slash Commands**: Primary user interface through Discord's native slash command system
- **Ephemeral Responses**: Private feedback to users for validation errors and rate limiting

### Backend Architecture
- **Node.js Application**: Single-file entry point (`index.js`) that initializes the Discord client
- **Modular Command System**: Commands are loaded dynamically from the `commands/` directory
- **Utility Modules**: Separate modules for logging and rate limiting functionality

### Core Components
- **Discord.js Client**: Handles Discord API interactions with appropriate gateway intents
- **Command Handler**: Automatically discovers and registers slash commands
- **Rate Limiting System**: In-memory rate limiting with configurable windows and limits
- **Audit Logging**: File-based JSON logging system for confession tracking

## Key Components

### Command System
- **Confession Command** (`commands/confess.js`): Handles anonymous confession submissions
  - Supports text, images, or both
  - Validates content length and file types
  - Integrates with rate limiting and logging

### Utility Systems
- **Rate Limiter** (`utils/rateLimit.js`): 
  - In-memory tracking of user submission attempts
  - Configurable time windows and maximum attempts
  - Automatic cleanup of expired records
  
- **Logger** (`utils/logger.js`):
  - File-based JSON logging to `logs/confessions.json`
  - Maintains last 1000 confessions to prevent file bloat
  - Stores confession metadata for audit purposes

### Configuration Management
- **Static Configuration** (`config.json`): Centralized settings for:
  - Channel IDs and admin roles
  - Rate limiting parameters
  - Content validation rules (text length, image types/sizes)

## Data Flow

1. **User Interaction**: User invokes `/confess` slash command with text and/or image
2. **Rate Limit Check**: System validates user hasn't exceeded submission limits
3. **Content Validation**: Text length and image format/size validation
4. **Confession Processing**: Content is formatted and posted to designated channel
5. **Audit Logging**: Confession details logged for moderation purposes
6. **User Feedback**: Confirmation or error message sent privately to user

## External Dependencies

### Discord.js Framework
- **Version**: 14.21.0
- **Purpose**: Discord API integration and bot functionality
- **Key Features Used**: Slash commands, embeds, file attachments, gateway intents

### Node.js Built-ins
- **File System (fs)**: For logging and configuration management
- **Path**: For file path resolution
- **HTTPS**: For image downloading and processing

## Deployment Strategy

### Environment Configuration
- **Discord Bot Token**: Required via `DISCORD_TOKEN` environment variable
- **Client ID**: Required via `CLIENT_ID` environment variable for command registration

### File Structure Requirements
- **Logs Directory**: Automatically created at `logs/` for confession audit trail
- **Commands Directory**: Must exist with command modules for dynamic loading

### Operational Considerations
- **Memory Management**: Rate limiting data stored in memory (resets on restart)
- **File Growth**: Logging system automatically truncates to prevent disk space issues
- **Command Registration**: Slash commands deployed globally on startup

## Recent Changes (July 14, 2025)

### Major Updates
- **Unlimited Channel Support**: Removed single channel restriction, now supports multiple confession channels
- **Flexible Channel Selection**: Users can specify target channel or use configured defaults
- **French Language Support**: All user-facing messages translated to French
- **Admin Management System**: Complete admin command suite for channel and confession management
- **Enhanced Logging**: Detailed audit trail with admin search capabilities
- **Relaxed Content Requirements**: Text and image are now optional (configurable)
- **Boutique Restructure**: /boutique now displays shop directly in ephemeral mode (private to user)
- **Separate Leaderboards**: /topargent for wealth rankings and /karma for karma rankings replace combined system
- **Daily Rewards**: Complete daily reward system with configurable amounts and proper routing
- **Admin Commands**: Four new admin-only commands for managing user economy and karma systems
- **Enhanced Stealing**: /voler command now supports targeted stealing with member selection or random victim selection
- **Security Update**: All configuration commands now ephemeral and restricted to admin/moderators only

### New Features  
- `/confess` command for anonymous confessions with silent confirmation and auto-thread support
- `/config` command with interactive Discord menus for channel and log management
- `/dashboard` command providing access to full web panel interface
- `/stats` command for viewing detailed statistics directly in Discord
- `/autothread` command for managing automatic thread creation with configurable settings
- **Auto-Thread System**: Unlimited channel support with customizable thread names, archive times, and slow mode
- **Admin Log Integration**: Confession details automatically sent to configured admin channel with images
- **Web Panel Access**: Complete management interface accessible via public Replit URL with auto-thread configuration
- **Economy System**: Full karma-based economy with 12 commands:
  - `/economie`: View profile and statistics
  - `/travailler`: Good action (+1😇 -1😈) with configurable rewards
  - `/pecher`: Good action with fishing mechanics
  - `/donner`: Good action that transfers money to specified member and gives high karma
  - `/voler`: Bad action (+1😈 -1😇) with failure risk
  - `/crime`: Bad action with high rewards but high karma penalty
  - `/parier`: Bad action with gambling mechanics (50% win/lose)
  - `/daily`: Daily reward system with streak mechanics
  - `/boutique`: Direct shop access with role purchasing
  - `/topargent`: Wealth leaderboard rankings
  - `/karma`: Karma leaderboard rankings (good/bad)
  - `/configeconomie`: Admin configuration for actions, shop, and karma rewards
- **Admin Economy Management**: 4 admin-only commands:
  - `/ajoutargent`: Add money to any member with amount selection
  - `/retraitargent`: Remove money from any member with validation
  - `/ajoutkarma`: Add karma (good/bad) to any member with type selection
  - `/retraitkarma`: Remove karma (good/bad) from any member with validation

### Configuration Changes
- `confessionChannels` array replaces single `confessionChannelId`
- Added content requirement toggles (`requireContent`, `allowTextOnly`, etc.)
- Increased rate limit from 3 to 5 attempts per window
- Extended max text length from 2000 to 4000 characters

### Current System Status (July 15, 2025)
- **25 Active Commands**: /confess, /config, /dashboard, /stats, /autothread, /economie, /travailler, /pecher, /voler, /crime, /parier, /donner, /configeconomie, /daily, /boutique, /topargent, /karma, /ajoutargent, /retraitargent, /ajoutkarma, /retraitkarma, /solde, /staff, /compter, /musique, /configmusique
- **Confession System**: Silent submission with logs sent to admin channel including images
- **Auto-Thread System**: Deux systèmes distincts - confessions via /config et global via /autothread
- **Global Auto-Thread**: Système complet façon Needle pour tous les messages (sauf confessions)
- **Economy System**: Complete karma-based economy with good/bad actions, cooldowns, and rewards
- **Daily Rewards**: Configurable daily rewards with streak system and admin configuration
- **Boutique System**: Direct ephemeral shop access for users with role purchasing capabilities
- **Leaderboard System**: Separate commands for wealth (/topargent) and karma (/karma) rankings
- **Admin Management**: Complete admin commands for money (/ajoutargent, /retraitargent) and karma (/ajoutkarma, /retraitkarma) management
- **Karma System**: Good actions (😇) vs bad actions (😈) with configurable effects
- **Logging System**: Fully functional with API endpoints and Discord admin channel integration
- **Web Panel**: Accessible via public URL avec page dédiée pour auto-thread global
- **Channel Management**: Unlimited confession channels supported with auto-thread capabilities
- **Admin Logging**: Complete audit trail with user identification and image display for moderation
- **Configuration Séparée**: /config pour confessions, /autothread pour système global, /configeconomie pour économie

### Architecture Updates (July 14, 2025)
- **Auto-Thread Integration**: Fonctionnalité auto-thread intégrée dans la commande /config principale
- **Commande Renommée**: /autothread → /autothreadconfession pour éviter les conflits
- **Interface Unifiée**: Gestion centralisée des canaux, logs et auto-threads via /config
- **Debugging Optimisé**: Logs de debug réduits pour améliorer les performances

## Recent Updates (July 15, 2025)

### Message Rewards System Added
- **Automatic Money Gain**: Members now earn money automatically when writing messages
- **Configurable Settings**: Amount per message and cooldown configurable via `/configeconomie`
- **Anti-Spam Protection**: Built-in cooldown system prevents abuse
- **Discord Integration**: System integrated into existing economy framework

### New Features
- **Message Rewards Configuration**: New section in `/configeconomie` for message rewards
- **Automatic Detection**: System detects all user messages (excluding bots)
- **Cooldown Management**: Prevents spam with configurable cooldown periods
- **Admin Control**: Full admin control over enable/disable, amounts, and cooldowns

### Technical Implementation
- Enhanced `index.js` with `handleMessageReward()` function
- New configuration storage in `data/message_rewards.json`
- Integration with existing cooldown system via `economyManager`
- Real-time money distribution with console logging

### Latest Updates (July 15, 2025)
- **Music System Removed**: Complete removal of music system due to persistent connectivity issues
- **User Info System**: New `/userinfo` command with comprehensive user statistics display
  - User Discord registration date and server join date
  - Message count tracking system across servers
  - Balance, XP, and karma (good/bad) display
  - Stylized embed design matching futuristic theme
  - Level calculation based on XP (1000 XP per level)
  - Karma level system (Saint, Bon, Neutre, Mauvais, Diabolique)
- **XP System**: Automatic XP gain system (1 XP per message sent)
- **Message Statistics**: Real-time message counting per user per server
- **Data Migration**: Automatic migration system for existing users to include XP and normalized karma fields
- **Architecture Cleanup**: Removed all music-related code and handlers from main bot file
- **Command Count**: Reduced from 25 to 23 commands after music system removal

### Critical Stability Improvements (July 16, 2025)
- **502 Error Prevention**: Complete protection system against 502 Bad Gateway errors
  - Global error handling middleware with timeout protection (10s)
  - Try-catch blocks on all endpoints with fallback responses
  - Server error handling with automatic port conflict resolution
  - Response validation to prevent malformed headers
- **Proactive 502 Detection**: New `error_502_detector.js` system
  - Continuous monitoring of all endpoints every 30 seconds
  - Automatic restart trigger after 3 detected errors
  - Error logging and alert system for 502-specific incidents
  - Real-time tracking with 5-minute error count reset
- **Enhanced Auto-Restart**: Optimized `auto_restart.js` with faster response
  - Reduced timeout from 5s to 3s for faster issue detection
  - Health checks every 20 seconds instead of 30
  - Improved process management with SIGKILL fallback
  - Environment variables optimization for production stability
- **Stability Monitoring**: Advanced `stability_monitor.js` system
  - Multi-endpoint health checks every 10 seconds
  - Uptime tracking with detailed performance metrics
  - Automatic report generation every 15 minutes
  - Memory usage and response time monitoring

### UptimeRobot Integration (July 15, 2025)
- **Keep-Alive System**: Enhanced monitoring system with multiple endpoints
- **Multiple Monitoring Options**: `/ping`, `/health`, `/status`, `/metrics` endpoints
- **Real-time Status Tracking**: Uptime monitoring, memory usage, request counting
- **Automatic Restart**: UptimeRobot ensures 24/7 bot availability
- **Comprehensive Metrics**: System health, performance data, and bot status
- **Port 3000 Monitoring**: Dedicated keep-alive server running parallel to main bot

### Stability Improvements (July 16, 2025)
- **JSON Error Protection**: Added try/catch for all JSON.parse operations to prevent crashes
- **Automatic File Repair**: Corrupted JSON files automatically recreated with default values
- **Health Check System**: New comprehensive health monitoring system (`health_check.js`)
- **Workflow Cleanup**: Removed duplicate workflows causing resource conflicts
- **Enhanced Error Handling**: Robust fallback mechanisms for file system operations
- **Memory Monitoring**: Real-time memory usage tracking and optimization
- **Process Stability**: Improved error recovery and graceful degradation

### Data Persistence Solution (July 16, 2025)
- **Unified Data Manager**: New centralized data management system (`utils/dataManager.js`)
- **Automatic Backup System**: Automated backups every 15 minutes with 10 backup history
- **Atomic File Operations**: Safe write operations with temp files and atomic rename
- **Corruption Recovery**: Automatic restoration from backup if main files become corrupted
- **Manual Backup Triggers**: Critical operation backups (message rewards, economy actions)
- **Persistent Storage**: Robust file system operations preventing data loss overnight
- **Backup Directory**: Organized backup storage in `data/backups/` with timestamp naming

### Deployment Configuration Fix (July 16, 2025)
- **Static Deployment Fix**: Created proper "BAG v2" directory with landing page
- **Landing Page**: Professional HTML page displaying bot status and features
- **SEO Optimization**: Added robots.txt, sitemap.xml, and manifest.json
- **Alternative Configurations**: Created Docker and autoscale deployment options
- **Health Endpoints**: Verified robust health check system on multiple ports
- **Deployment Documentation**: Complete DEPLOYMENT.md guide for various hosting options
- **Port Configuration**: Port 3000 (health checks), Port 5000 (web panel)
- **Static Assets**: Professional landing page with bot information and status indicators

### Project Cleanup (July 16, 2025)
- **Files Cleaned**: Removed temporary exports, documentation drafts, and unused configurations
- **Project Optimized**: Kept only essential files for bot functionality
- **Token Issue Resolved**: Updated Discord token and restored bot functionality
- **Bot Status**: Fully operational with 24 commands and all monitoring systems active

### Render.com Compatibility Package (July 17, 2025)
- **Problem Identified**: Discord.js selectors (StringSelectMenu, RoleSelectMenu) failing on Render.com deployment
- **Solution Created**: Specialized version with timeout handling, flag corrections, and interaction routing
- **Package Generated**: `bag-bot-v2-render-fixed.tar.gz` (111KB) with all fixes implemented
- **Key Fixes**: Replaced ephemeral flags, added defer logic, 10s timeout protection, health checks
- **Deployment Ready**: Complete Render.com package with documentation and optimized configuration

### Bug Fixes and Synchronization (July 17, 2025)
- **ConfigEconomie Actions**: Fixed missing methods for action configuration (handleActionConfigSelection, handleActionSettings)
- **Compter System**: Added complete activation/deactivation functionality with proper UI
- **Data Synchronization**: Unified karma calculation and display format across userinfo, solde, and topargent
- **Error Handling**: Fixed steal command null reference error on cooldown checks
- **All Commands**: 24 commands now fully functional with consistent data presentation

### Missing Components  
- **Database Integration**: Currently uses file-based logging; could benefit from persistent storage
- **Authentication System**: Relies on Discord's built-in user authentication
- **Image Storage**: Images are processed but storage mechanism not fully implemented
- **Multi-language Support**: Could support language detection/selection