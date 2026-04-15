const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async () => {
  const config = getConfig();

  const localDir = path.resolve("functions");
  if (!fs.existsSync(localDir)) {
    console.log("❌ Folder functions tidak ada");
    return;
  }

  const localFiles = fs.readdirSync(localDir).filter(f => f.endsWith(".js"));

  const res = await axios.get(`${config.url}/functions-list`, {
    headers: { Authorization: `Bearer ${config.token}` }
  });

  const serverFiles = res.data.functions;

  console.log("\n🔍 DIFF RESULT:\n");

  localFiles.forEach(file => {
    const name = file.replace(".js", "");
    const localCode = fs.readFileSync(path.join(localDir, file), "utf-8");

    const server = serverFiles.find(f => f.name === name);

    if (!server) {
      console.log(`➕ ${name} (hanya lokal)`);
    } else if (server.code !== localCode) {
      console.log(`⚠️ ${name} (berbeda)`);
    } else {
      console.log(`✅ ${name} (sama)`);
    }
  });
};