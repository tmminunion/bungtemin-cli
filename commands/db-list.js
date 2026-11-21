const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async () => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  try {
    const res = await axios.get(`${config.url}/api/files`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    const raw = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.files)
      ? res.data.files
      : [];

    const names = raw
      .map((item) => (typeof item === "string" ? item : item?.name || ""))
      .filter(Boolean)
      .map((n) => n.replace(/\.json$/i, ""))
      .sort();

    if (names.length === 0) {
      console.log("ℹ️  Belum ada JSON DB di server NUDB.");
      return;
    }

    const localDir = path.resolve("data");
    console.log(`\n🗄️  JSON DB di server NUDB (${names.length}):\n`);

    for (const name of names) {
      const hasLocal = fs.existsSync(path.join(localDir, `${name}.json`));
      const badge = hasLocal ? "✅ lokal" : "☁️  server";
      console.log(`- ${name.padEnd(26)} | ${badge}`);
    }
    console.log(`\n💡 Pull ke lokal: bungtemin db-pull <nama>`);
  } catch (err) {
    console.error("❌ Gagal mengambil daftar DB:");
    console.error(err.response?.data || err.message);
  }
};
