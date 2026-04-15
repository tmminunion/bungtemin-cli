const axios = require("axios");
const inquirer = require("inquirer");
const fs = require("fs-extra"); // Gunakan fs-extra untuk kemudahan
const path = require("path");
const { getConfig } = require("../utils/config");

module.exports = async (name) => {
  const config = getConfig();

  if (!config.token) {
    console.log("❌ Error: Anda belum login.");
    return;
  }

  if (!name) {
    console.log("❌ Error: Nama function wajib diisi.");
    return;
  }

  const functionName = name.replace(".js", "");
  const filePath = path.join(process.cwd(), "functions", `${functionName}.js`);

  try {
    const prompt = inquirer.prompt ? inquirer.prompt : inquirer.default.prompt;

    const answers = await prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: `Hapus '${functionName}' dari server DAN lokal?`,
        default: false,
      },
    ]);

    if (!answers.confirmDelete) {
      console.log("🟡 Penghapusan dibatalkan.");
      return;
    }

    // 1. Hapus di Server
    console.log(`⏳ Menghapus '${functionName}' di server...`);
    const res = await axios.delete(
      `${config.url}/functions/${functionName}`,
      {
        headers: { Authorization: `Bearer ${config.token}` },
      }
    );

    console.log(`✅ Server: ${res.data.message}`);

    // 2. Hapus di Lokal (Hanya jika file ada)
    if (fs.existsSync(filePath)) {
      await fs.remove(filePath);
      console.log(`✅ Lokal: File 'functions/${functionName}.js' telah dihapus.`);
    } else {
      console.log(`ℹ️  Lokal: File tidak ditemukan di folder functions, dilewati.`);
    }

  } catch (err) {
    console.error("❌ Gagal menghapus.");
    if (err.response) {
      console.error(`Pesan Server: ${err.response.data.message || err.response.statusText}`);
    } else {
      console.error(`Pesan: ${err.message}`);
    }
  }
};
