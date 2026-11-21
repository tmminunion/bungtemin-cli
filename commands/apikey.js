const crypto = require("crypto");
const axios = require("axios");
const { getConfig } = require("../utils/config");

function parseBool(val, fallback) {
  if (val === undefined || val === null) return fallback;
  const s = String(val).trim().toLowerCase();
  if (["true", "1", "yes", "ya", "on"].includes(s)) return true;
  if (["false", "0", "no", "tidak", "off"].includes(s)) return false;
  return fallback;
}

function generateKey(len = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function listKeys() {
  const config = getConfig();
  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  try {
    const res = await axios.get(`${config.url}/api/keys`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    const keys = Array.isArray(res.data?.keys) ? res.data.keys : [];
    if (keys.length === 0) {
      console.log("ℹ️  Belum ada API key di server NUDB.");
      return;
    }

    console.log(`\n🔑 API Keys terdaftar di NUDB (${keys.length}):\n`);
    keys.forEach((k, i) => {
      const r = k.read !== false ? "R" : "-";
      const w = k.write !== false ? "W" : "-";
      const dbs =
        Array.isArray(k.databases) && k.databases.length > 0
          ? k.databases.join(",")
          : "ALL";
      const masked =
        k.key && k.key.length > 12
          ? `${k.key.slice(0, 6)}...${k.key.slice(-4)}`
          : k.key;
      console.log(
        `${String(i + 1).padStart(2)}. ${masked.padEnd(16)} | [${r}${w}] | DB: ${dbs.padEnd(16)} | ${k.description || "-"}`
      );
    });
    console.log(`\n💡 Buat baru: bungtemin apikey-create --desc "Flow Read Only" --read true --write false`);
  } catch (err) {
    console.error("❌ Gagal mengambil API keys:", err.response?.data || err.message);
  }
}

async function createKey(options = {}) {
  const config = getConfig();
  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  const key = options.key ? String(options.key).trim() : generateKey(32);
  const description = String(options.desc || "Generated via bungtemin-cli").trim();
  const read = parseBool(options.read, true);
  const write = parseBool(options.write, false); // default aman: read-only kecuali --write true
  const databases = options.db ? String(options.db).trim() : "";

  try {
    await axios.post(
      `${config.url}/api/keys`,
      { key, description, read, write, databases },
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ API Key berhasil dibuat di NUDB:");
    console.log(`   Key        : ${key}`);
    console.log(`   Deskripsi  : ${description}`);
    console.log(`   Izin       : read=${read}, write=${write}`);
    console.log(`   Scope DB   : ${databases || "Semua DB"}`);
    console.log(`   Pakai di API: Header 'x-api-key: ${key}'`);
  } catch (err) {
    console.error("❌ Gagal membuat API key:", err.response?.data || err.message);
  }
}

async function deleteKey(key) {
  const config = getConfig();
  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }
  if (!key) {
    console.log("❌ API key yang ingin dihapus wajib diisi.");
    return;
  }
  try {
    await axios.delete(`${config.url}/api/keys/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    console.log("✅ API Key berhasil dihapus dari NUDB.");
  } catch (err) {
    console.error("❌ Gagal menghapus API key:", err.response?.data || err.message);
  }
}

module.exports = { listKeys, createKey, deleteKey };
