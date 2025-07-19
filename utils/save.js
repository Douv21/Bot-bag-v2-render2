const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/autothread.json');

function loadConfig() {
  try {
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveConfig(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { loadConfig, saveConfig };
