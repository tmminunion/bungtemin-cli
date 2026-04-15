const axios = require("axios");
const inquirer = require("inquirer").default;
const { saveConfig } = require("../utils/config");

module.exports = async () => {
  const answers = await inquirer.prompt([
    { name: "url", message: "API URL:", default: "https://nudb.bungtemin.net" },
    { name: "username", message: "Username:" }, // 🔥 ganti ini
    { name: "password", message: "Password:", type: "password" },
  ]);

  try {
    const res = await axios.post(`${answers.url}/auth/login`, {
      username: answers.username, // 🔥 ganti ini
      password: answers.password,
    });

    saveConfig({
      token: res.data.token,
      url: answers.url,
    });

    console.log("✅ Login berhasil");
  } catch (err) {
    console.error("❌ Login gagal");
    console.error(err.response?.data || err.message); // 🔥 debug
  }
};