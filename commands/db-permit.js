const axios = require("axios");
const { getConfig } = require("../utils/config");

function parseBool(val) {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim().toLowerCase();
  if (["true", "1", "yes", "ya", "on"].includes(s)) return true;
  if (["false", "0", "no", "tidak", "off"].includes(s)) return false;
  throw new Error(`Nilai boolean tidak valid: '${val}' (gunakan true atau false)`);
}

module.exports = async (name, options = {}) => {
  const config = getConfig();
  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  if (!name) {
    console.log("❌ Nama DB wajib diisi (contoh: bungtemin db-permit Absensi --read false --write false)");
    return;
  }

  const cleanName = String(name).replace(/\.json$/i, "");
  const headers = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };

  let cur = { read: false, write: false };
  try {
    const getRes = await axios.get(`${config.url}/api/permit/${encodeURIComponent(cleanName)}`, {
      headers,
      validateStatus: () => true,
    });
    if (getRes.status === 200 && getRes.data && typeof getRes.data === "object") {
      cur = { read: Boolean(getRes.data.read), write: Boolean(getRes.data.write) };
    }
  } catch (_) {}

  let nextRead;
  let nextWrite;
  try {
    nextRead = parseBool(options.read);
    nextWrite = parseBool(options.write);
  } catch (e) {
    console.error("❌", e.message);
    return;
  }

  // Jika tidak ada flag --read / --write, tampilkan status izin saat ini
  if (nextRead === undefined && nextWrite === undefined) {
    console.log(`🔐 Izin API untuk DB '${cleanName}':`);
    console.log(`   read  : ${cur.read ? "PUBLIC (true)" : "PRIVATE / butuh API key (false)"}`);
    console.log(`   write : ${cur.write ? "PUBLIC (true)" : "PRIVATE / butuh API key (false)"}`);
    console.log(`💡 Ubah izin: bungtemin db-permit ${cleanName} --read false --write false`);
    return;
  }

  const payload = {
    read: nextRead !== undefined ? nextRead : cur.read,
    write: nextWrite !== undefined ? nextWrite : cur.write,
  };

  try {
    const res = await axios.post(
      `${config.url}/api/permit/${encodeURIComponent(cleanName)}`,
      payload,
      { headers }
    );
    console.log(`✅ Izin DB '${cleanName}' diperbarui:`);
    console.log(`   read  : ${payload.read ? "PUBLIC (true)" : "PRIVATE / butuh API key (false)"}`);
    console.log(`   write : ${payload.write ? "PUBLIC (true)" : "PRIVATE / butuh API key (false)"}`);
    if (res.data?.message) console.log(`   ↳ Server: ${res.data.message}`);
  } catch (err) {
    console.error("❌ Gagal update izin DB:");
    console.error(err.response?.data || err.message);
  }
};
