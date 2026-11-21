const axios = require("axios");
const { getConfig } = require("../utils/config");

function formatDateWib(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  // Format dd-mm-yyyy HH:mm (Asia/Jakarta WIB)
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.day}-${map.month}-${map.year} ${map.hour}:${map.minute} WIB`;
}

module.exports = async () => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  try {
    const res = await axios.get(`${config.url}/functions-meta`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    const functions = res.data.functions || [];
    console.log(`\n📦 Functions aktif di server (${functions.length}):\n`);

    functions.forEach((fn) => {
      const updated = formatDateWib(fn.updated);
      console.log(`- ${fn.name.padEnd(22)} | ${updated} | ${config.url}/functions/${fn.name}`);
    });
  } catch (err) {
    console.error("❌ Gagal mengambil daftar function:", err.response?.data || err.message);
  }
};
