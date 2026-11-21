const axios = require("axios");
const { getConfig } = require("../utils/config");

async function flowHealth() {
  const config = getConfig();
  const nudbBase = config.url || "https://nudb.bungtemin.net";

  console.log("🩺 Mengecek status ekosistem Bungtemin Flow...\n");

  const checks = [
    { label: "NUDB Webhook Engine", url: `${nudbBase}/api/webhook/health` },
    { label: "Bungtemin WA OTP", url: "https://bungtemin.net/btapi/User/wa_otp_status" },
    { label: "Flow Studio (Vercel)", url: "https://bungtemin-flow.vercel.app/", headOnly: true },
  ];

  for (const c of checks) {
    const t0 = Date.now();
    try {
      const res = await axios({
        method: c.headOnly ? "HEAD" : "GET",
        url: c.url,
        timeout: 8000,
        validateStatus: () => true,
      });
      const ms = Date.now() - t0;
      const ok = res.status >= 200 && res.status < 300;
      const extra =
        !c.headOnly && res.data && typeof res.data === "object"
          ? res.data.message || res.data.status || (res.data.ok ? "ok" : "")
          : "";
      console.log(
        `${ok ? "✅" : "❌"} ${c.label.padEnd(22)} | HTTP ${res.status} (${ms} ms)${extra ? ` · ${extra}` : ""}`
      );
    } catch (err) {
      console.log(`❌ ${c.label.padEnd(22)} | Error: ${err.message}`);
    }
  }
}

async function flowTrigger(slug, options = {}) {
  if (!slug) {
    console.log("❌ Slug Incoming Hook wajib diisi (contoh: bungtemin flow trigger hook-test-api --token <TOKEN>)");
    return;
  }

  const config = getConfig();
  const nudbBase = config.url || "https://nudb.bungtemin.net";
  const method = String(options.method || "POST").toUpperCase();
  const cleanSlug = String(slug).replace(/^\/+/, "").trim();
  const endpoint = `${nudbBase}/api/webhook/hook/${encodeURIComponent(cleanSlug)}`;

  let payload = {};
  if (options.data) {
    try {
      payload = JSON.parse(options.data);
    } catch (e) {
      console.error("❌ JSON --data tidak valid:", e.message);
      return;
    }
  }

  const headers = { "Content-Type": "application/json" };
  const params = {};
  if (options.token) {
    headers["X-Webhook-Token"] = String(options.token).trim();
    if (method === "GET") params.token = String(options.token).trim();
  }
  if (method === "GET" && payload && typeof payload === "object") {
    Object.assign(params, payload);
  }

  const t0 = Date.now();
  try {
    console.log(`⚡ Trigger Flow [${method}]: ${endpoint}`);
    const res = await axios({
      method,
      url: endpoint,
      headers,
      params: Object.keys(params).length ? params : undefined,
      data: method !== "GET" ? payload : undefined,
      timeout: 30000,
      validateStatus: () => true,
    });
    const ms = Date.now() - t0;
    const icon = res.status >= 200 && res.status < 300 ? "✅" : "⚠️";
    console.log(`${icon} HTTP ${res.status} (${ms} ms):`);
    if (typeof res.data === "object") {
      console.log(JSON.stringify(res.data, null, 2));
    } else {
      console.log(String(res.data));
    }
  } catch (err) {
    console.error("❌ Gagal trigger Flow:", err.message);
  }
}

module.exports = { flowHealth, flowTrigger };
