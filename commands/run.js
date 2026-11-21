const axios = require("axios");
const { runFunctionDetailed } = require("../emulator/runner");
const { getConfig } = require("../utils/config");

module.exports = async (functionName, options = {}) => {
  const cleanName = String(functionName || "").replace(/\.js$/, "");
  const method = String(options.method || "POST").toUpperCase();

  let payload = {};
  if (options.data) {
    try {
      payload = JSON.parse(options.data);
    } catch (e) {
      console.error("❌ Format JSON pada --data tidak valid:", e.message);
      return;
    }
  }

  // Mode remote: eksekusi langsung ke server NUDB
  if (options.remote) {
    const config = getConfig();
    const baseUrl = config.url || "https://nudb.bungtemin.net";
    const endpoint = `${baseUrl}/functions/${encodeURIComponent(cleanName)}`;

    try {
      console.log(`☁️  Running remote [${method}]: ${endpoint}`);
      const headers = {};
      if (config.token) {
        headers.Authorization = `Bearer ${config.token}`;
      }

      const res = await axios({
        method,
        url: endpoint,
        headers,
        params: method === "GET" ? payload : undefined,
        data: method !== "GET" ? payload : undefined,
        validateStatus: () => true,
      });

      console.log(`✅ HTTP ${res.status}:`);
      if (typeof res.data === "object") {
        console.log(JSON.stringify(res.data, null, 2));
      } else {
        console.log(res.data);
      }
    } catch (err) {
      console.error("❌ Remote Error:", err.message);
    }
    return;
  }

  // Mode lokal: emulator runner
  try {
    console.log(`🚀 Running local function [${method}]: ${cleanName}`);
    const result = await runFunctionDetailed(cleanName, payload, { method });

    console.log(`✅ HTTP ${result.statusCode}:`);
    if (typeof result.data === "object") {
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log(result.data);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
};
