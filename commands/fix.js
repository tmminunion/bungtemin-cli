const path = require("path");
const fs = require("fs-extra");
const { runFunctionDetailed } = require("../emulator/runner");

module.exports = async (name) => {
  const functionName = String(name || "").replace(/\.js$/, "");
  const filePath = path.join(process.cwd(), "functions", `${functionName}.js`);

  // Import ai.js di sini untuk menghindari circular dependency
  const aiMain = require("./ai");

  if (!fs.existsSync(filePath)) {
    return console.log(`❌ File functions/${functionName}.js tidak ditemukan.`);
  }

  try {
    const result = await runFunctionDetailed(functionName, {}, { method: "POST" });
    console.log(`✅ Result (HTTP ${result.statusCode}):`);
    console.log(
      typeof result.data === "object"
        ? JSON.stringify(result.data, null, 2)
        : result.data
    );
  } catch (err) {
    console.log(`⚠️  Terdeteksi Error: "${err.message}"`);
    console.log(`🤖 Memperbaiki otomatis...`);

    await aiMain(`Perbaiki error berikut pada function ini: ${err.message}`, {
      edit: functionName,
      isFixing: true,
    });

    console.log(`🔄 Verifikasi ulang hasil perbaikan...`);
    try {
      const result = await runFunctionDetailed(functionName, {}, { method: "POST" });
      console.log(`✅ Verifikasi berhasil (HTTP ${result.statusCode}):`);
      console.log(
        typeof result.data === "object"
          ? JSON.stringify(result.data, null, 2)
          : result.data
      );
    } catch (finalErr) {
      console.log(`❌ Masih error: ${finalErr.message}. Silakan cek manual.`);
    }
  }
};
