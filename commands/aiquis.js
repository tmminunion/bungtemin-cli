const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (userPrompt, options) => {
  const config = getConfig();
  if (!config.ai_key) return console.log("❌ API Key belum diset! Gunakan: bungtemin set-ai-key");
    // Perbaikan variabel dan typo
    const topic = userPrompt; 
    const count = 10;
    const difficulty = "menengah";

    if (!topic) {
        console.error("❌ Error: Topic wajib diisi!");
        return;
    }

    console.log(`🚀 Siap mengerjakan kuis dengan topik: ${topic}`);

    try {
        const genAI = new GoogleGenerativeAI(config.ai_key);
        
        // Menggunakan model flash untuk kecepatan di CLI
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3-flash-preview", 
            generationConfig: { responseMimeType: "application/json" }
        });

        console.log("🤖 Sedang men-generate soal via Bungtemin AI...");

        const prompt = `Buatlah kuis pilihan ganda tentang "${topic}" sejumlah ${count} soal.
        Tingkat kesulitan: ${difficulty}.
        Format Output JSON:
        {
          "title": "Judul Kuis",
          "description": "Deskripsi",
          "questions": [
            {
              "question": "Teks Pertanyaan",
              "options": [
                {"text": "Jawaban Benar", "correct": true},
                {"text": "Pilihan Salah 1", "correct": false},
                {"text": "Pilihan Salah 2", "correct": false},
                {"text": "Pilihan Salah 3", "correct": false}
              ],
              "timer": 15
            }
          ]
        }`;

        const result = await model.generateContent(prompt);
        const quizAI = JSON.parse(result.response.text());
        
        console.log('✅ AI Berhasil membuat kuis:', quizAI.title);

        const quizId = "Quiz" + Date.now() + "Ai"; 

        // 1. Format untuk data/quis (Lobby)
        const lobbyPayload = {
            Title: quizAI.title,
            UserID:'00415024',
            Description: quizAI.description,
            Slug: quizId,
            Image: `https://picsum.photos/400/200?seed=${quizId}`,
            Status: true
        };

        // 2. Format untuk data/Pertanyaan
        const questionPayload = {
            quiz_id: quizId,
            questions: quizAI.questions.map(q => ({
                text: q.question,
                timer: q.timer || 15,
                options: q.options 
            }))
        };

        console.log("📤 Mengirim data ke database Nudb...");

        // Jalankan posting ke database
        await Promise.all([
            axios.post(`https://nudb.bungtemin.net/data/Quiz/${quizId}`, lobbyPayload),
            axios.post(`https://nudb.bungtemin.net/data/Pertanyaan/${quizId}`, questionPayload)
        ]);

        console.log(`\n✨ BERHASIL!`);
        console.log(`🆔 Quiz ID: ${quizId}`);
        console.log(`🔗 Cek di Lobby aplikasi kamu sekarang.`);

    } catch (error) {
        console.error("❌ Terjadi Kesalahan:", error.message);
    }
};
