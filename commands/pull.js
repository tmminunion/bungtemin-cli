const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (options = {}) => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  try {
    const targetDir = path.resolve("functions");

    console.log("📥 Mengambil data terbaru dari server...");
    const res = await axios.get(`${config.url}/functions-list`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    const functions = res.data.functions || [];
    fs.ensureDirSync(targetDir);

    const serverNames = new Set(functions.map((fn) => fn.name));
    const localFiles = fs
      .readdirSync(targetDir)
      .filter((f) => f.endsWith(".js"));

    if (functions.length === 0) {
      console.log("⚠️  Server tidak memiliki function.");
      if (options.clean && localFiles.length > 0) {
        for (const f of localFiles) {
          fs.removeSync(path.join(targetDir, f));
        }
        console.log("🧹 Mode --clean: semua file lokal telah dibersihkan.");
      }
      return;
    }

    // Tulis / update semua function dari server tanpa menghapus draft lokal
    for (const fn of functions) {
      const filePath = path.join(targetDir, `${fn.name}.js`);
      const code = fn.code || "// No code available";
      fs.writeFileSync(filePath, code, "utf-8");
      console.log(`✅ Synced: ${fn.name}.js`);
    }

    // Cek file lokal yang tidak ada di server
    const localOnly = localFiles.filter(
      (f) => !serverNames.has(f.replace(/\.js$/, ""))
    );

    if (localOnly.length > 0) {
      if (options.clean) {
        for (const f of localOnly) {
          fs.removeSync(path.join(targetDir, f));
          console.log(`🧹 Dihapus (--clean): ${f}`);
        }
      } else {
        console.log(
          `\nℹ️  ${localOnly.length} file lokal tetap dipertahankan (belum ada di server): ${localOnly.join(", ")}`
        );
        console.log("💡 Gunakan 'bungtemin pull --clean' jika ingin ikut menghapus file lokal tersebut.");
      }
    }

    console.log(`\n🎉 Berhasil sinkronisasi ${functions.length} function dari server!`);
  } catch (err) {
    console.error("❌ Gagal pull/sync");
    if (err.response) {
      console.error(`Pesan Server: ${err.response.data.message || err.response.statusText}`);
    } else {
      console.error(`Pesan: ${err.message}`);
    }
  }
};
