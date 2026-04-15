const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async () => {
  const config = getConfig();

  if (!config.token) {
    console.log("❌ Login dulu");
    return;
  }

  try {
    const res = await axios.get(`${config.url}/functions-meta`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    console.log("\n📦 Functions di server:\n");

    res.data.functions.forEach(fn => {
      console.log(`- ${fn.name} (updated: ${fn.updated})`);
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};