const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

async function pullSingleDb(config, rawName, dir) {
  const cleanName = String(rawName).replace(/\.json$/i, "");
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
    return { ok: false, name: cleanName, reason: "Kosong / tidak ditemukan" };
  }

  const filePath = path.join(dir, `${cleanName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  return { ok: true, name: cleanName, filePath };
}

module.exports = async (name, options = {}) => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  const dir = path.resolve("data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const pullAll = Boolean(options.all) || !name;

  if (pullAll) {
    try {
      console.log("📥 Mengambil daftar semua JSON DB dari server...");
      const listRes = await axios.get(`${config.url}/api/files`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });

      const raw = Array.isArray(listRes.data)
        ? listRes.data
        : Array.isArray(listRes.data?.files)
        ? listRes.data.files
        : [];

      const names = raw
        .map((item) => (typeof item === "string" ? item : item?.name || ""))
        .filter(Boolean)
        .map((n) => n.replace(/\.json$/i, ""))
        .sort();

      if (names.length === 0) {
        console.log("ℹ️  Tidak ada JSON DB di server.");
        return;
      }

      let okCount = 0;
      let failCount = 0;

      for (const dbName of names) {
        try {
          const r = await pullSingleDb(config, dbName, dir);
          if (r.ok) {
            okCount++;
            console.log(`✅ Synced: data/${r.name}.json`);
          } else {
            failCount++;
            console.log(`⚠️  Lewati ${r.name}: ${r.reason}`);
          }
        } catch (err) {
          failCount++;
          console.error(
            `❌ Gagal pull ${dbName}:`,
            err.response?.data?.message || err.message
          );
        }
      }

      console.log(`\n🎉 Selesai pull all DB! (${okCount} berhasil, ${failCount} gagal)`);
    } catch (err) {
      console.error("❌ Gagal mengambil daftar DB dari server:");
      console.error(err.response?.data || err.message);
    }
    return;
  }

  try {
    const cleanName = String(name).replace(/\.json$/i, "");
    console.log(`📥 Mengambil DB '${cleanName}' dari server...`);
    const r = await pullSingleDb(config, cleanName, dir);
    if (r.ok) {
      console.log(`✅ DB '${r.name}' berhasil di-sync ke data/${r.name}.json`);
    } else {
      console.log(`⚠️  DB '${r.name}': ${r.reason}`);
    }
  } catch (err) {
    console.error("❌ DB pull gagal:");
    console.error(err.response?.data || err.message);
  }
};
