const { spawn } = require("child_process");
const path = require("path");

module.exports = () => {
  console.log("🚀 Starting Bungtemin Emulator...");

  const serverPath = path.join(__dirname, "../emulator/server.js");

  spawn("node", [serverPath], {
    stdio: "inherit"
  });
};