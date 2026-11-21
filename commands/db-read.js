const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

function getByPath(obj, keyPath) {
  if (!keyPath) return obj;
  return String(keyPath)
    .split(".")
    .reduce((acc, part) => (acc !== null && acc !== undefined ? acc[part] : undefined), obj);
}

module.exports = async (name, options = {}) => {
  if (!name) {
    console.log("❌ Nama DB wajib diisi (contoh: bungtemin db-read Absensi)");
    return;
  }

  const cleanName = String(name).replace(/\.json$/i, "");
  let payload;

  if (options.local) {
    const filePath = path.resolve("data", `${cleanName}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File lokal data/${cleanName}.json tidak ditemukan.`);
      console.log(`💡 Jalankan 'bungtemin db-pull ${cleanName}' atau baca langsung dari server tanpa --local.`);
      return;
    }
    try {
      payload = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`📄 [LOKAL] data/${cleanName}.json`);
    } catch (err) {
      console.error(`❌ File lokal JSON tidak valid: ${err.message}`);
      return;
    }
  } else {
    const config = getConfig();
    if (!config.token || !config.url) {
      console.log("❌ Silakan login dulu: bungtemin login");
      return;
    }

    try {
      const res = await axios.get(`${config.url}/db/${encodeURIComponent(cleanName)}`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      payload =
        res.data && Object.prototype.hasOwnProperty.call(res.data, "data")
          ? res.data.data
          : res.data;
      console.log(`☁️  [SERVER] ${config.url}/db/${cleanName}`);
    } catch (err) {
      console.error("❌ Gagal membaca DB dari server:");
      console.error(err.response?.data || err.message);
      return;
    }
  }

  if (options.key) {
    payload = getByPath(payload, options.key);
  }

  const limit = options.limit ? parseInt(options.limit, 10) : 0;
  if (Array.isArray(payload)) {
    const total = payload.length;
    if (limit > 0 && total > limit) {
      console.log(`ℹ️  Array: menampilkan ${limit} dari ${total} item\n`);
      console.log(JSON.stringify(payload.slice(0, limit), null, 2));
      return;
    }
    console.log(`ℹ️  Array (${total} item)\n`);
  } else if (payload && typeof payload === "object") {
    const keys = Object.keys(payload);
    if (limit > 0 && keys.length > limit) {
      const sliced = {};
      keys.slice(0, limit).forEach((k) => {
        sliced[k] = payload[k];
      });
      console.log(`ℹ️  Object: menampilkan ${limit} dari ${keys.length} key\n`);
      console.log(JSON.stringify(sliced, null, 2));
      return;
    }
  }

  console.log(
    typeof payload === "object" ? JSON.stringify(payload, null, 2) : String(payload)
  );
};
