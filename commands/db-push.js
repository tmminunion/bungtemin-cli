const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (file) => {
  const config = getConfig();

  if (!config.token) {
    console.log("❌ Login dulu");
    return;
  }

  const filePath = path.resolve(file);

  if (!fs.existsSync(filePath)) {
    console.log("❌ File tidak ditemukan");
    return;
  }

  const name = path.basename(filePath, ".json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  try {
    const res = await axios.post(
      `${config.url}/db/${name}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    console.log(`📦 ${res.data.message}`);

  } catch (err) {
    console.error("❌ DB push gagal");
    console.error(err.response?.data || err.message);
  }
};