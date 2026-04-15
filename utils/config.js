const fs = require("fs");
const path = require("path");

const configPath = path.join(process.env.HOME, ".bungtemin.json");

function setConfig(newData) {
  const currentConfig = getConfig();
  const updatedConfig = { ...currentConfig, ...newData };
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
}

function getConfig() {
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath));
  } catch (e) {
    return {};
  }
}

// Export dengan nama setConfig DAN saveConfig (supaya aman buat file lama)
module.exports = { 
  setConfig, 
  saveConfig: setConfig, 
  getConfig 
};
