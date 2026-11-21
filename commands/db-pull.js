const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (name) => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  if (!name) {
    console.log("❌ Nama DB wajib diisi (contoh: bungtemin db-pull Absensi)");
    return;
  }

  const cleanName = String(name).replace(/\.json$/i, "");

  try {
    console.log(`📥 Mengambil DB '${cleanName}' dari server...`);
    const res = await axios.get(`${config.url}/db/${encodeURIComponent(cleanName)}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    const payload =
      res.data && Object.prototype.hasOwnProperty.call(res.data, "data")
        ? res.data.data
        : res.data;

    if (payload === undefined) {
      console.log(`⚠️  DB '${cleanName}' kosong atau tidak ditemukan.`);
      return;
    }

    const dir = path.resolve("data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${cleanName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

    console.log(`✅ DB '${cleanName}' berhasil di-sync ke data/${cleanName}.json`);
  } catch (err) {
    console.error("❌ DB pull gagal:");
    console.error(err.response?.data || err.message);
  }
};
