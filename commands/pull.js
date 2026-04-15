const fs = require("fs-extra"); // Gunakan fs-extra agar lebih mudah menghapus folder
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async () => {
  const config = getConfig();

  if (!config.token) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  try {
    const targetDir = path.resolve("functions");

    // 1. Ambil data dari server dulu untuk memastikan server aman
    console.log("📥 Mengambil data terbaru dari server...");
    const res = await axios.get(`${config.url}/functions-list`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    const functions = res.data.functions;

    // 2. Membersihkan folder lokal
    if (fs.existsSync(targetDir)) {
      console.log("🧹 Membersihkan folder functions lokal...");
      fs.emptyDirSync(targetDir); // Mengosongkan isi folder tanpa menghapus folder utamanya
    } else {
      fs.ensureDirSync(targetDir); // Buat folder jika belum ada
    }

    if (!functions || functions.length === 0) {
      console.log("⚠️ Server kosong. Folder lokal sekarang juga kosong.");
      return;
    }

    // 3. Simpan file baru dari server
    for (const fn of functions) {
      const filePath = path.join(targetDir, `${fn.name}.js`);
      
      // Pastikan fn.code tidak kosong
      const code = fn.code || "// No code available";
      fs.writeFileSync(filePath, code);

      console.log(`✅ Synced: ${fn.name}.js`);
    }

    console.log(`\n🎉 Berhasil sinkronisasi ${functions.length} function!`);

  } catch (err) {
    console.error("❌ Gagal pull/sync");
    if (err.response) {
      console.error(`Pesan Server: ${err.response.data.message || err.response.statusText}`);
    } else {
      console.error(`Pesan: ${err.message}`);
    }
  }
};
