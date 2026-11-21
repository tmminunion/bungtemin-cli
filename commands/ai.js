const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");
const { getConfig } = require("../utils/config");
const { SERVER_NUDB_PACKAGES } = require("../utils/packages");

module.exports = async (userPrompt, options = {}) => {
  const config = getConfig();
  if (!config.ai_key) {
    return console.log("❌ API Key belum diset! Gunakan: bungtemin set-ai-key <key>");
  }

  const fixCommand = require("./fix"); // Import di dalam agar tidak circular
  const modelName = config.ai_model || "gemini-2.5-flash";

  try {
    const genAI = new GoogleGenerativeAI(config.ai_key);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Penentuan Nama File yang Cerdas
    let targetFileName = options.name || (options.edit ? options.edit : null);
    if (!targetFileName) {
      targetFileName = "function" + Date.now();
    }

    targetFileName = targetFileName.replace(/\.js$/, "");
    const filePath = path.join(process.cwd(), "functions", `${targetFileName}.js`);

    let existingCode = "";
    if (fs.existsSync(filePath)) {
      existingCode = await fs.readFile(filePath, "utf8");
      console.log(`📝 Membaca file: ${targetFileName}.js...`);
    }

    console.log(`🤖 Memproses dengan ${modelName}...`);

    const systemInstruction = existingCode
      ? `Update kode berikut sesuai permintaan: "${userPrompt}".\nKODE LAMA:\n${existingCode}`
      : `Buat fungsi serverless Node.js (Express handler) untuk: "${userPrompt}".`;

    const fullPrompt = `${systemInstruction}
ATURAN KETAT:
1. Gunakan format CommonJS: module.exports = async (req, res) => { ... };
2. Baca input secara fleksibel dari req.query dan req.body: const input = { ...(req.query || {}), ...(req.body || {}) };
3. Kembalikan JSON terstruktur menggunakan res.status(200).json({ ok: true, ... }) (atau status error 400/500 dengan { ok: false, error: ... }).
4. Utamakan hanya built-in Node.js (fs, path, crypto, url, dll) atau package yang sudah tersedia di server NUDB: ${SERVER_NUDB_PACKAGES.join(", ")}.
5. Tambahkan komentar singkat /** @description ... */ di baris paling atas.
6. Berikan HANYA kode JavaScript murni tanpa backticks atau penjelasan markdown.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const code = response
      .text()
      .trim()
      .replace(/^```[a-zA-Z]*\r?\n/, "")
      .replace(/\r?\n```$/, "");

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, code, "utf8");

    console.log(`✅ Berhasil diupdate: functions/${targetFileName}.js`);

    // Jalankan Auto-Heal (kecuali jika dipanggil dari fix itu sendiri)
    if (!options.isFixing) {
      console.log(`🛡️  Auto-Heal: Mengetes fungsi...`);
      await fixCommand(targetFileName);
    }
  } catch (err) {
    console.error("❌ AI Error:", err.message);
  }
};
