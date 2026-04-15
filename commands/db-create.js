const axios = require("axios");
const { getConfig } = require("../utils/config");

module.exports = async (name, jsonString) => {
  const config = getConfig();

  if (!config.token) {
    console.log("❌ Login dulu");
    return;
  }

  try {
    const data = JSON.parse(jsonString);

    const res = await axios.post(
      `${config.url}/api/create/${name}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📦 Created:", res.data);
  } catch (err) {
    console.log("❌ db-create gagal");
    console.log(err.response?.data || err.message);
  }
};