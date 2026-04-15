const fs = require("fs-extra");
const path = require("path");

// Tambahkan 'options' di parameter kedua
module.exports = async (name, options) => {
  // Jika options tidak ada (misal dipanggil tanpa flag), default ke false
  const authStatus = (options && options.auth) ? "true" : "false";

  if (!name) {
    console.error("❌ Nama function wajib diisi!");
    return;
  }

  // Sanitasi nama: hapus .js jika user mengetikkannya
  const functionName = name.replace(".js", "");
  const targetDir = path.resolve("functions");
  const filePath = path.join(targetDir, `${functionName}.js`);

  // Template konten
  const template = `const crypto = require("crypto");

module.exports = async (req, res) => {
  const length = parseInt(req.query.length) || 32;

  const result = crypto.randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);

  res.json({ success: true, result });
};

module.exports.auth = ${authStatus};
`;

  try {
    // Pastikan folder functions ada
    await fs.ensureDir(targetDir);

    // Cek apakah file sudah ada
    if (fs.existsSync(filePath)) {
      console.error(`❌ Error: File '${functionName}.js' sudah ada di folder functions.`);
      return;
    }

    // Tulis file
    await fs.writeFile(filePath, template, "utf8");

    console.log(`✨ Berhasil membuat function baru:`);
    console.log(`📍 Lokasi: functions/${functionName}.js`);
    console.log(`🔐 Auth: ${authStatus}`);
    console.log(`🚀 Siap untuk dideploy: bungtemin deploy ${functionName}`);

  } catch (err) {
    console.error("❌ Gagal membuat function baru:");
    console.error(err.message);
  }
};
