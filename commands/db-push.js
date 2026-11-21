const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (file) => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  if (!file) {
    console.log("❌ Nama file/DB wajib diisi (contoh: bungtemin db-push Absensi)");
    return;
  }

  // Smart path discovery: path mentah -> + .json -> data/<file>.json
  let filePath = path.resolve(file);
  if (!fs.existsSync(filePath) && !filePath.endsWith(".json")) {
    const withJson = filePath + ".json";
    if (fs.existsSync(withJson)) filePath = withJson;
  }
  if (!fs.existsSync(filePath)) {
    const inData = path.resolve(
      "data",
      file.endsWith(".json") ? file : `${file}.json`
    );
    if (fs.existsSync(inData)) {
      filePath = inData;
    } else {
      console.log("❌ File tidak ditemukan:", file);
      console.log("💡 Tips: Cukup ketik nama DB-nya saja (contoh: bungtemin db-push Absensi)");
      return;
    }
  }

  const name = path.basename(filePath, ".json");
  let data;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(raw);
  } catch (parseErr) {
    console.error(`❌ Format JSON tidak valid di ${path.relative(process.cwd(), filePath)}:`);
    console.error(`   ${parseErr.message}`);
    return;
  }

  try {
    console.log(`🚀 Pushing DB '${name}' dari ${path.relative(process.cwd(), filePath)}...`);
    const res = await axios.post(`${config.url}/db/${encodeURIComponent(name)}`, data, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ ${res.data?.message || `DB '${name}' berhasil di-push`}`);
  } catch (err) {
    console.error("❌ DB push gagal:");
    console.error(err.response?.data || err.message);
  }
};
