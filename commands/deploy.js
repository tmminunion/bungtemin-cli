const fs = require("fs");
const path = require("path");
const vm = require("vm");
const axios = require("axios");
const { getConfig } = require("../utils/config");
const { scanDependencies, buildFunctionBundle } = require("../utils/packages");

function validateSyntax(code, filename) {
  const wrapped = `(function(exports, require, module, __filename, __dirname) {\n${code}\n});`;
  new vm.Script(wrapped, { filename });
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

module.exports = async (input, options = {}) => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  if (!input) input = "functions";

  let targetPath = path.resolve(input);

  // =============================
  // 🧠 Smart Path Discovery
  // =============================
  if (!fs.existsSync(targetPath) && !targetPath.endsWith(".js")) {
    const withJs = targetPath + ".js";
    if (fs.existsSync(withJs)) targetPath = withJs;
  }

  if (!fs.existsSync(targetPath)) {
    const inFunctions = path.resolve(
      "functions",
      input.endsWith(".js") ? input : input + ".js"
    );
    if (fs.existsSync(inFunctions)) {
      targetPath = inFunctions;
    } else {
      console.log("❌ Path tidak ditemukan:", input);
      console.log("💡 Tips: Cukup ketik nama function-nya saja (contoh: bungtemin deploy nufat)");
      return;
    }
  }

  const stat = fs.statSync(targetPath);
  let files = [];

  if (stat.isDirectory()) {
    console.log("📦 Deploy semua function di folder:", targetPath);
    files = fs
      .readdirSync(targetPath)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(targetPath, f));
  } else {
    files = [targetPath];
  }

  if (files.length === 0) {
    console.log("❌ Tidak ada file .js ditemukan");
    return;
  }

  // Commander mengubah --no-bundle menjadi options.bundle === false
  const useBundle = options.bundle !== false;
  const minify = Boolean(options.minify);

  // =============================
  // 🏗️  Build & Deploy Execution
  // =============================
  let successCount = 0;
  let failCount = 0;

  for (const filePath of files) {
    const name = path.basename(filePath, ".js");
    if (name === "index" && stat.isDirectory()) continue;

    try {
      const rawCode = fs.readFileSync(filePath, "utf-8");
      let deployCode = rawCode;

      if (useBundle) {
        console.log(`🔨 Building ${name} (esbuild bundle)...`);
        try {
          const built = await buildFunctionBundle(filePath, { minify });
          deployCode = built.code;

          const infoParts = [`${formatKB(built.sizeBytes)}`];
          if (built.deps.extraPackages.length > 0) {
            infoParts.push(`Bundled: ${built.deps.extraPackages.join(", ")}`);
          }
          if (built.deps.relativeLocal.length > 0) {
            infoParts.push(`Local: ${built.deps.relativeLocal.join(", ")}`);
          }
          if (built.deps.serverPackages.length > 0) {
            infoParts.push(`External(NUDB): ${built.deps.serverPackages.join(", ")}`);
          }
          console.log(`   📦 Build OK | ${infoParts.join(" | ")}`);
        } catch (buildErr) {
          failCount++;
          console.error(`❌ Build gagal untuk ${name}.js — deploy dibatalkan:`);
          console.error(`   ${buildErr.message}`);
          console.error(
            `   💡 Jika memakai package baru, pastikan sudah di-install di lokal (npm install <package>).`
          );
          continue;
        }
      } else {
        // Mode --no-bundle: tetap validasi syntax dan peringatkan jika ada package luar NUDB
        try {
          validateSyntax(rawCode, filePath);
        } catch (syntaxErr) {
          failCount++;
          console.error(`❌ Syntax Error di ${name}.js — deploy dibatalkan:`);
          console.error(`   ${syntaxErr.message}`);
          continue;
        }
        const deps = scanDependencies(rawCode);
        if (deps.extraPackages.length > 0) {
          console.warn(
            `⚠️  Peringatan (${name}): package [${deps.extraPackages.join(", ")}] tidak ada di server NUDB dan --no-bundle aktif.`
          );
        }
      }

      // Final syntax check pada hasil build
      validateSyntax(deployCode, filePath);

      console.log(`🚀 Deploying ${name}...`);

      const res = await axios.post(
        `${config.url}/deploy`,
        { name, code: deployCode },
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
          },
        }
      );

      successCount++;
      console.log(`✅ ${name}: ${res.data.message || "Deployed"}`);
      console.log(`   ↳ Endpoint: ${config.url}/functions/${name}`);
    } catch (err) {
      failCount++;
      console.error(`❌ Gagal deploy ${path.basename(filePath)}`);
      if (err.response) {
        console.error(`Pesan: ${err.response.data.message || err.response.statusText}`);
      } else {
        console.error(`Pesan: ${err.message}`);
      }
    }
  }

  console.log(`\n🎉 Selesai deploy! (${successCount} berhasil, ${failCount} gagal)`);
};
