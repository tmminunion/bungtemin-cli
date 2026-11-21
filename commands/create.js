const fs = require("fs-extra");
const path = require("path");

module.exports = async (name, options = {}) => {
  const authStatus = options && options.auth ? "true" : "false";
  const desc = (options && options.desc) || "Bungtemin Serverless Function (Flow Studio & HTTP ready)";

  if (!name) {
    console.error("❌ Nama function wajib diisi!");
    return;
  }

  // Sanitasi nama: hapus .js jika user mengetikkannya
  const functionName = name.replace(/\.js$/, "");
  const targetDir = path.resolve("functions");
  const filePath = path.join(targetDir, `${functionName}.js`);

  // Template Flow-ready: mendukung POST JSON (Flow Studio / webhook) & GET query (browser)
  const template = `/**
 * @description ${desc}
 * @mode helper | response
 */
module.exports = async (req, res) => {
  try {
    const input = {
      ...(req.query || {}),
      ...(req.body && typeof req.body === "object" ? req.body : {}),
    };

    return res.status(200).json({
      ok: true,
      function: "${functionName}",
      data: input,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};

module.exports.auth = ${authStatus};
`;

  try {
    await fs.ensureDir(targetDir);

    if (fs.existsSync(filePath)) {
      console.error(`❌ Error: File '${functionName}.js' sudah ada di folder functions.`);
      return;
    }

    await fs.writeFile(filePath, template, "utf8");

    console.log(`✨ Berhasil membuat function baru:`);
    console.log(`📍 Lokasi : functions/${functionName}.js`);
    console.log(`🔐 Auth   : ${authStatus}`);
    console.log(`🧪 Test   : bungtemin run ${functionName} --data '{"nama":"Baim"}'`);
    console.log(`🚀 Deploy : bungtemin deploy ${functionName}`);
  } catch (err) {
    console.error("❌ Gagal membuat function baru:");
    console.error(err.message);
  }
};
