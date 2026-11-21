const fs = require("fs");
const path = require("path");

const configPath = path.join(process.env.HOME || ".", ".bungtemin.json");

function setConfig(newData) {
  const currentConfig = getConfig();
  const updatedConfig = { ...currentConfig, ...newData };
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(configPath, 0o600);
  } catch (_) {
    // Abaikan jika filesystem tidak mendukung chmod
  }
}

function getConfig() {
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (e) {
    return {};
  }
}

// Export dengan nama setConfig DAN saveConfig (supaya aman buat file lama)
module.exports = {
  setConfig,
  saveConfig: setConfig,
  getConfig,
  configPath,
};
