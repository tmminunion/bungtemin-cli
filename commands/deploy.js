const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (input) => {
  const config = getConfig();

  if (!config.token) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  // Jika input tidak ada, default ke folder 'functions'
  if (!input) input = "functions";

  let targetPath = path.resolve(input);
  
  // =============================
  // 🧠 Smart Path Discovery
  // =============================
  
  // Jika path mentah tidak ada, coba cek dengan tambahan .js
  if (!fs.existsSync(targetPath) && !targetPath.endsWith(".js")) {
    const withJs = targetPath + ".js";
    if (fs.existsSync(withJs)) targetPath = withJs;
  }

  // Jika masih tidak ada, coba cari di dalam folder /functions/
  if (!fs.existsSync(targetPath)) {
    const inFunctions = path.resolve("functions", input.endsWith(".js") ? input : input + ".js");
    if (fs.existsSync(inFunctions)) {
      targetPath = inFunctions;
    } else {
      console.log("❌ Path tidak ditemukan:", input);
      console.log("💡 Tips: Cukup ketik nama function-nya saja (contoh: bungtemin deploy nufat)");
      return;
    }
  }

  const stat = fs.statSync(targetPath);
  let files = [];

  if (stat.isDirectory()) {
    console.log("📦 Deploy semua function di folder:", targetPath);
    files = fs
      .readdirSync(targetPath)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(targetPath, f));
  } else {
    files = [targetPath];
  }

  if (files.length === 0) {
    console.log("❌ Tidak ada file .js ditemukan");
    return;
  }

  // =============================
  // 🚀 Deploy Execution
  // =============================
  for (const filePath of files) {
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      const name = path.basename(filePath, ".js");

      // Skip file folder/index.js jika kamu tidak mau men-deploy entry point
      if (name === "index" && stat.isDirectory()) continue;

      console.log(`🚀 Deploying ${name}...`);

      const res = await axios.post(
        `${config.url}/deploy`,
        { name, code },
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
          },
        }
      );

      console.log(`✅ ${name}: ${res.data.message}`);
    } catch (err) {
      console.error(`❌ Gagal deploy ${path.basename(filePath)}`);
      if (err.response) {
        console.error(`Pesan: ${err.response.data.message || err.response.statusText}`);
      } else {
        console.error(`Pesan: ${err.message}`);
      }
    }
  }

  console.log("🎉 Selesai deploy!");
};
