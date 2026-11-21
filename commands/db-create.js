const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (name, jsonString) => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  if (!name) {
    console.log("❌ Nama DB wajib diisi (contoh: bungtemin db-create mydata '{\"ok\":true}')");
    return;
  }

  const cleanName = String(name).replace(/\.json$/i, "");
  let data = {};

  if (jsonString !== undefined) {
    try {
      data = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("❌ Format JSON tidak valid:", parseErr.message);
      return;
    }
  }

  try {
    const res = await axios.post(
      `${config.url}/api/create/${encodeURIComponent(cleanName)}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const dir = path.resolve("data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${cleanName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    console.log(`✅ DB '${cleanName}' berhasil dibuat di server & disimpan di data/${cleanName}.json`);
    if (res.data?.message) console.log(`   ↳ Server: ${res.data.message}`);
  } catch (err) {
    console.error("❌ db-create gagal:");
    console.error(err.response?.data || err.message);
  }
};
