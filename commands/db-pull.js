const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (name) => {
  const config = getConfig();

  if (!config.token) {
    console.log("❌ Login dulu");
    return;
  }

  try {
    const res = await axios.get(
      `${config.url}/db/${name}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    const dir = path.resolve("data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const filePath = path.join(dir, `${name}.json`);

    fs.writeFileSync(
      filePath,
      JSON.stringify(res.data.data, null, 2)
    );

    console.log(`📥 DB ${name} berhasil di-sync`);

  } catch (err) {
    console.error("❌ DB pull gagal");
    console.error(err.response?.data || err.message);
  }
};