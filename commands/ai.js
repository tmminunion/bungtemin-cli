const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");
const { getConfig } = require("../utils/config");

module.exports = async (userPrompt, options) => {
  const config = getConfig();
  if (!config.ai_key) return console.log("❌ API Key belum diset! Gunakan: bungtemin set-ai-key");

  const fixCommand = require("./fix"); // Import di dalam agar tidak circular

  try {
    const genAI = new GoogleGenerativeAI(config.ai_key);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Penentuan Nama File yang Cerdas
    let targetFileName = options.name || (options.edit ? options.edit : null);
    
    if (!targetFileName) {
      targetFileName = "function" + Date.now();
    }

    targetFileName = targetFileName.replace(".js", "");
    const filePath = path.join(process.cwd(), "functions", `${targetFileName}.js`);
    
    let existingCode = "";
    if (fs.existsSync(filePath)) {
      existingCode = await fs.readFile(filePath, "utf8");
      console.log(`📝 Membaca file: ${targetFileName}.js...`);
    }

    console.log(`🤖 Sedang memproses...`);

    // Prompt Engineering
    const systemInstruction = existingCode 
      ? `Update kode berikut: "${userPrompt}". \nKODE LAMA: \n${existingCode}`
      : `Buat fungsi Node.js untuk: "${userPrompt}".`;

    const fullPrompt = `${systemInstruction}
    ATURAN KETAT:
    1. Gunakan format: module.exports = async (req, res) => { ... };
    2. WAJIB gunakan res.json({ ... }).
    3. DILARANG KERAS menggunakan res.status().
    4. Berikan HANYA kode javascript saja tanpa backticks atau markdown.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let code = response.text().trim()
      .replace(/^```[a-z]*\n/g, '')
      .replace(/\n```$/g, '');

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, code, "utf8");

    console.log(`✅ Berhasil diupdate: functions/${targetFileName}.js`);

    // Jalankan Auto-Heal (Kecuali jika ini dipanggil dari fix itu sendiri untuk menghindari loop)
    if (!options.isFixing) {
      console.log(`🛡️  Auto-Heal: Mengetes fungsi...`);
      await fixCommand(targetFileName);
    }

  } catch (err) {
    console.error("❌ AI Error:", err.message);
  }
};
