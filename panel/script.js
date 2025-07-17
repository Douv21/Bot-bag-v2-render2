// Configuration API
const API_BASE = '/api';

// État global de l'application
const appState = {
    currentTab: 'confessions',
    botData: {
        status: 'offline',
        guilds: [],
        config: {},
        stats: {}
    },
    selectedGuild: null,
    currentGuildData: null
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializeNavigation();
    initializeEventListeners();
    loadBotData();
    
    // Actualisation automatique toutes les 30 secondes
    setInterval(loadBotData, 30000);
}

// === NAVIGATION ===
function initializeNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
    // Mise à jour des boutons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Mise à jour du contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    appState.currentTab = tabName;
}

// === EVENT LISTENERS ===
function initializeEventListeners() {
    // Sélection du serveur
    document.getElementById('guild-select').addEventListener('change', onGuildSelect);
    
    // Confessions
    document.getElementById('add-confession-channel').addEventListener('click', addConfessionChannel);
    document.getElementById('set-log-channel').addEventListener('click', setLogChannel);
    document.getElementById('confession-autothread-enabled').addEventListener('change', toggleConfessionAutothread);
    document.getElementById('refresh-logs').addEventListener('click', refreshLogs);
    
    // Auto-thread global
    document.getElementById('add-autothread-channel').addEventListener('click', addGlobalAutothreadChannel);
    document.getElementById('save-autothread-settings').addEventListener('click', saveGlobalAutothreadSettings);
}

// === CHARGEMENT DES DONNÉES ===
async function loadBotData() {
    try {
        showLoading('Chargement des données du bot...');
        
        const response = await fetch(`${API_BASE}/status`);
        if (!response.ok) throw new Error('Erreur de connexion');
        
        appState.botData = await response.json();
        updateUI();
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showToast('Impossible de se connecter au bot', 'error');
    } finally {
        hideLoading();
    }
}

function updateUI() {
    updateBotStatus();
    updateGuildSelect();
    updateStats();
    
    if (appState.selectedGuild) {
        updateGuildData();
    }
}

function updateBotStatus() {
    const statusElement = document.getElementById('bot-status');
    const isOnline = appState.botData.status === 'online';
    
    statusElement.textContent = isOnline ? 'En ligne' : 'Déconnecté';
    statusElement.className = `status ${isOnline ? 'online' : 'offline'}`;
}

function updateGuildSelect() {
    const select = document.getElementById('guild-select');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Sélectionner un serveur...</option>';
    
    appState.botData.guilds.forEach(guild => {
        const option = document.createElement('option');
        option.value = guild.id;
        option.textContent = `${guild.name} (${guild.memberCount} membres)`;
        select.appendChild(option);
    });
    
    if (currentValue) {
        select.value = currentValue;
    }
    
    updateControlsState();
}

function updateStats() {
    const stats = appState.botData.stats;
    
    document.getElementById('total-confessions').textContent = stats.totalConfessions || 0;
    document.getElementById('unique-users').textContent = stats.uniqueUsers || 0;
    document.getElementById('last-24h').textContent = stats.last24Hours || 0;
    document.getElementById('guild-count').textContent = appState.botData.guilds.length;
    
    // Graphiques
    const total = stats.totalConfessions || 1;
    updateChart('text-only-bar', 'text-only-count', stats.textOnly || 0, total);
    updateChart('image-only-bar', 'image-only-count', stats.imageOnly || 0, total);
    updateChart('both-bar', 'both-count', stats.textAndImage || 0, total);
}

function updateChart(barId, countId, value, total) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    document.getElementById(barId).style.width = `${percentage}%`;
    document.getElementById(countId).textContent = value;
}

// === GESTION DES SERVEURS ===
function onGuildSelect() {
    const guildId = document.getElementById('guild-select').value;
    appState.selectedGuild = guildId;
    
    if (guildId) {
        loadGuildData(guildId);
    }
    
    updateControlsState();
}

async function loadGuildData(guildId) {
    try {
        showLoading('Chargement des données du serveur...');
        
        const response = await fetch(`${API_BASE}/guild/${guildId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement du serveur');
        
        const guildData = await response.json();
        appState.currentGuildData = guildData; // Stocker les données du serveur
        console.log('Données du serveur chargées:', guildData);
        updateGuildData(guildData);
        
    } catch (error) {
        console.error('Erreur lors du chargement du serveur:', error);
        showToast('Erreur lors du chargement du serveur', 'error');
        appState.currentGuildData = null;
    } finally {
        hideLoading();
    }
}

function updateGuildData(guildData = null) {
    if (!guildData && appState.selectedGuild) {
        const guild = appState.botData.guilds.find(g => g.id === appState.selectedGuild);
        if (guild) guildData = guild;
    }
    
    if (!guildData) return;
    
    updateChannelSelectors(guildData);
    updateConfessionChannelsList();
    updateGlobalAutothreadChannelsList();
    updateLogChannelInfo();
    updateConfessionAutothreadSettings();
    refreshLogs();
}

function updateChannelSelectors(guildData) {
    const confessionSelect = document.getElementById('confession-channel-select');
    const logSelect = document.getElementById('log-channel-select');
    const autothreadSelect = document.getElementById('autothread-channel-select');
    
    // Reset options et conserver les placeholders
    confessionSelect.innerHTML = '<option value="">Sélectionner un canal...</option>';
    logSelect.innerHTML = '<option value="">Aucun canal de log</option>';
    autothreadSelect.innerHTML = '<option value="">Sélectionner un canal...</option>';
    
    // Ajouter les canaux
    if (guildData.channels && guildData.channels.length > 0) {
        guildData.channels.forEach(channel => {
            // Vérifier que c'est un canal texte (type "text" ou type === 0)
            if (channel.type === 'text' || channel.type === 0) {
                [confessionSelect, logSelect, autothreadSelect].forEach(select => {
                    const option = document.createElement('option');
                    option.value = channel.id;
                    option.textContent = `#${channel.name}`;
                    select.appendChild(option);
                });
            }
        });
        console.log(`Canaux ajoutés: ${guildData.channels.length}`);
    } else {
        console.log('Aucun canal trouvé dans guildData:', guildData);
    }
}

function updateControlsState() {
    const hasGuild = !!appState.selectedGuild;
    
    // Activer/désactiver les contrôles selon la sélection du serveur
    document.getElementById('confession-channel-select').disabled = !hasGuild;
    document.getElementById('add-confession-channel').disabled = !hasGuild;
    document.getElementById('log-channel-select').disabled = !hasGuild;
    document.getElementById('set-log-channel').disabled = !hasGuild;
    document.getElementById('autothread-channel-select').disabled = !hasGuild;
    document.getElementById('add-autothread-channel').disabled = !hasGuild;
}

// === CONFESSIONS ===
async function addConfessionChannel() {
    const guildId = appState.selectedGuild;
    const channelId = document.getElementById('confession-channel-select').value;
    
    if (!guildId || !channelId) {
        showToast('Veuillez sélectionner un serveur et un canal', 'warning');
        return;
    }
    
    try {
        showLoading('Ajout du canal de confession...');
        
        const response = await fetch(`${API_BASE}/config/confession-channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, channelId })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        
        showToast('Canal de confession ajouté avec succès', 'success');
        await loadBotData();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de l\'ajout du canal', 'error');
    } finally {
        hideLoading();
    }
}

async function removeConfessionChannel(channelId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce canal ?')) return;
    
    try {
        showLoading('Suppression du canal...');
        
        const response = await fetch(`${API_BASE}/config/confession-channels/${channelId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        showToast('Canal supprimé avec succès', 'success');
        await loadBotData();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la suppression', 'error');
    } finally {
        hideLoading();
    }
}

function updateConfessionChannelsList() {
    const list = document.getElementById('confession-channels-list');
    const config = appState.botData.config;
    
    if (!config.confessionChannels || config.confessionChannels.length === 0) {
        list.innerHTML = '<li class="empty">Aucun canal configuré</li>';
        return;
    }
    
    // Récupérer les données du serveur sélectionné
    const guildData = appState.currentGuildData;
    
    list.innerHTML = config.confessionChannels.map(channelId => {
        let channelName = 'Canal inconnu';
        
        if (guildData && guildData.channels) {
            const channel = guildData.channels.find(c => c.id === channelId);
            if (channel) {
                channelName = channel.name;
            }
        }
        
        return `
            <li>
                <span class="channel-name">#${channelName}</span>
                <button class="btn btn-danger btn-small" onclick="removeConfessionChannel('${channelId}')">
                    Supprimer
                </button>
            </li>
        `;
    }).join('');
}

// === LOGS ===
async function setLogChannel() {
    const guildId = appState.selectedGuild;
    const channelId = document.getElementById('log-channel-select').value;
    
    try {
        showLoading('Configuration du canal de log...');
        
        const response = await fetch(`${API_BASE}/config/log-channel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, channelId })
        });
        
        if (!response.ok) throw new Error('Erreur lors de la configuration');
        
        showToast('Canal de log configuré avec succès', 'success');
        await loadBotData();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la configuration', 'error');
    } finally {
        hideLoading();
    }
}

function updateLogChannelInfo() {
    const config = appState.botData.config;
    const guildData = appState.currentGuildData;
    
    let logChannelName = 'Aucun';
    
    if (config.logChannelId && guildData && guildData.channels) {
        const logChannel = guildData.channels.find(c => c.id === config.logChannelId);
        if (logChannel) {
            logChannelName = `#${logChannel.name}`;
        }
    }
    
    document.getElementById('current-log-channel').textContent = logChannelName;
}

async function refreshLogs() {
    const limit = document.getElementById('logs-limit').value;
    
    try {
        const response = await fetch(`${API_BASE}/logs?limit=${limit}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des logs');
        
        const logs = await response.json();
        updateLogsDisplay(logs);
        
    } catch (error) {
        console.error('Erreur logs:', error);
        showToast('Erreur lors du chargement des logs', 'error');
    }
}

function updateLogsDisplay(logs) {
    const container = document.getElementById('logs-container');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<p class="empty">Aucune confession trouvée</p>';
        return;
    }
    
    container.innerHTML = logs.map(log => {
        const date = new Date(log.timestamp).toLocaleString('fr-FR');
        const content = log.content || '';
        const hasImage = log.hasImage;
        
        return `
            <div class="log-entry">
                <div class="log-header">
                    <span class="log-user">${log.author.username}</span>
                    <span class="log-time">${date}</span>
                </div>
                <div class="log-content">${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</div>
                <div class="log-meta">
                    <span>ID: ${log.id}</span>
                    ${hasImage ? '<span>📷 Image incluse</span>' : ''}
                    <a href="${log.messageUrl}" target="_blank">Voir le message</a>
                </div>
            </div>
        `;
    }).join('');
}

// === AUTO-THREAD CONFESSIONS ===
function toggleConfessionAutothread() {
    const enabled = document.getElementById('confession-autothread-enabled').checked;
    const settings = document.getElementById('confession-autothread-settings');
    
    settings.style.display = enabled ? 'block' : 'none';
}

function updateConfessionAutothreadSettings() {
    const config = appState.botData.config;
    const settings = config.autoThreadSettings;
    
    if (settings) {
        document.getElementById('confession-autothread-enabled').checked = settings.enabled || false;
        document.getElementById('confession-thread-name').value = settings.threadName || 'Discussion - Confession #{count}';
        document.getElementById('confession-thread-archive').value = settings.archiveAfter || 10080;
        document.getElementById('confession-thread-slowmode').value = settings.slowMode || 0;
        
        toggleConfessionAutothread();
    }
}

// === AUTO-THREAD GLOBAL ===
async function addGlobalAutothreadChannel() {
    const guildId = appState.selectedGuild;
    const channelId = document.getElementById('autothread-channel-select').value;
    
    if (!guildId || !channelId) {
        showToast('Veuillez sélectionner un serveur et un canal', 'warning');
        return;
    }
    
    try {
        showLoading('Ajout du canal auto-thread global...');
        
        const response = await fetch(`${API_BASE}/autothread/global/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, channelId })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        
        showToast('Canal auto-thread global ajouté avec succès', 'success');
        await loadBotData();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de l\'ajout du canal auto-thread global', 'error');
    } finally {
        hideLoading();
    }
}

async function removeGlobalAutothreadChannel(channelId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce canal ?')) return;
    
    const guildId = appState.selectedGuild;
    
    try {
        showLoading('Suppression du canal auto-thread global...');
        
        const response = await fetch(`${API_BASE}/autothread/global/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, channelId })
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        showToast('Canal auto-thread global supprimé avec succès', 'success');
        await loadBotData();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la suppression du canal auto-thread global', 'error');
    } finally {
        hideLoading();
    }
}

function updateGlobalAutothreadChannelsList() {
    const list = document.getElementById('autothread-channels-list');
    const config = appState.botData.config;
    
    if (!config.globalAutoThread || !config.globalAutoThread.channels || config.globalAutoThread.channels.length === 0) {
        list.innerHTML = '<li class="empty">Aucun canal configuré</li>';
        return;
    }
    
    const guildData = appState.currentGuildData;
    
    list.innerHTML = config.globalAutoThread.channels.map(channelId => {
        let channelName = 'Canal inconnu';
        
        if (guildData && guildData.channels) {
            const channel = guildData.channels.find(c => c.id === channelId);
            if (channel) {
                channelName = channel.name;
            }
        }
        
        return `
            <li>
                <span class="channel-name">#${channelName}</span>
                <button class="btn btn-danger btn-small" onclick="removeGlobalAutothreadChannel('${channelId}')">
                    Supprimer
                </button>
            </li>
        `;
    }).join('');
}

async function saveGlobalAutothreadSettings() {
    const guildId = appState.selectedGuild;
    
    if (!guildId) {
        showToast('Veuillez sélectionner un serveur', 'warning');
        return;
    }
    
    const settings = {
        archiveAfter: parseInt(document.getElementById('autothread-archive-time').value),
        threadName: document.getElementById('autothread-name').value,
        slowMode: parseInt(document.getElementById('autothread-slowmode').value),
        excludeConfessions: document.getElementById('autothread-exclude-confessions').checked
    };
    
    try {
        showLoading('Sauvegarde des paramètres auto-thread global...');
        
        const response = await fetch(`${API_BASE}/autothread/global/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, settings })
        });
        
        if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
        
        showToast('Paramètres auto-thread global sauvegardés avec succès', 'success');
        await loadBotData();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la sauvegarde des paramètres', 'error');
    } finally {
        hideLoading();
    }
}

// === UTILITAIRES UI ===
function showLoading(message = 'Chargement...') {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = document.getElementById('loading-message');
    
    messageEl.textContent = message;
    overlay.classList.add('show');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('show');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }
    }, 5000);
}

// Animation de sortie pour les toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);