const path = require("path");
const fs = require("fs-extra");

module.exports = async (name) => {
  const functionName = name.replace(".js", "");
  const filePath = path.join(process.cwd(), "functions", `${functionName}.js`);

  // Import ai.js di sini untuk menghindari circular dependency
  const aiMain = require("./ai");

  if (!fs.existsSync(filePath)) {
    return console.log(`❌ File functions/${functionName}.js tidak ditemukan.`);
  }

  // Mock Request & Response
  const req = { query: {}, body: {}, method: "GET" };
  const res = {
    json: (data) => {
      console.log("✅ Result:");
      console.log(JSON.stringify(data, null, 2));
    }
  };

  try {
    // Hapus cache agar require mengambil file versi terbaru hasil generate
    delete require.cache[require.resolve(filePath)];
    const fn = require(filePath);
    
    if (typeof fn !== "function") {
      throw new Error("File bukan merupakan fungsi (module.exports bukan function)");
    }

    await fn(req, res);
  } catch (err) {
    console.log(`⚠️  Terdeteksi Error: "${err.message}"`);
    console.log(`🤖 Memperbaiki otomatis...`);

    // Panggil kembali AI untuk edit, kasih flag isFixing agar tidak loop tak berujung
    await aiMain(`Perbaiki error ini: ${err.message}. Ingat, jangan pakai res.status().`, { 
      edit: functionName,
      isFixing: true 
    });
    
    // Jalankan sekali lagi setelah diperbaiki untuk verifikasi akhir
    console.log(`🔄 Verifikasi ulang hasil perbaikan...`);
    delete require.cache[require.resolve(filePath)];
    try {
      const newFn = require(filePath);
      await newFn(req, res);
    } catch (finalErr) {
      console.log(`❌ Masih error: ${finalErr.message}. Silakan cek manual.`);
    }
  }
};
