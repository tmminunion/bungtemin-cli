const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getConfig } = require("../utils/config");

function normalizeCode(str) {
  return String(str || "").replace(/\r\n/g, "\n").trimEnd();
}

module.exports = async () => {
  const config = getConfig();

  if (!config.token || !config.url) {
    console.log("❌ Silakan login dulu: bungtemin login");
    return;
  }

  const localDir = path.resolve("functions");
  const localFiles = fs.existsSync(localDir)
    ? fs.readdirSync(localDir).filter((f) => f.endsWith(".js"))
    : [];

  try {
    const res = await axios.get(`${config.url}/functions-list`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });

    const serverFiles = res.data.functions || [];
    const serverMap = new Map(serverFiles.map((f) => [f.name, f]));
    const localMap = new Map(
      localFiles.map((file) => [
        file.replace(/\.js$/, ""),
        fs.readFileSync(path.join(localDir, file), "utf-8"),
      ])
    );

    const allNames = Array.from(
      new Set([...localMap.keys(), ...serverMap.keys()])
    ).sort();

    if (allNames.length === 0) {
      console.log("ℹ️  Tidak ada function di lokal maupun server.");
      return;
    }

    console.log("\n🔍 DIFF LOKAL vs SERVER (NUDB / Flow Studio):\n");

    let sameCount = 0;
    let diffCount = 0;
    let localOnlyCount = 0;
    let serverOnlyCount = 0;

    for (const name of allNames) {
      const hasLocal = localMap.has(name);
      const hasServer = serverMap.has(name);

      if (hasLocal && !hasServer) {
        localOnlyCount++;
        console.log(`➕ ${name} (hanya lokal — belum di-deploy)`);
      } else if (!hasLocal && hasServer) {
        serverOnlyCount++;
        console.log(`☁️  ${name} (hanya di server / Flow Studio — jalankan 'bungtemin pull')`);
      } else {
        const localNorm = normalizeCode(localMap.get(name));
        const serverNorm = normalizeCode(serverMap.get(name).code);
        if (localNorm !== serverNorm) {
          diffCount++;
          console.log(`⚠️  ${name} (berbeda antara lokal & server)`);
        } else {
          sameCount++;
          console.log(`✅ ${name} (sama)`);
        }
      }
    }

    console.log(
      `\nRingkasan: ${sameCount} sama | ${diffCount} berbeda | ${localOnlyCount} lokal saja | ${serverOnlyCount} server saja`
    );
  } catch (err) {
    console.error("❌ Gagal mengambil diff dari server:");
    if (err.response) {
      console.error(`Pesan Server: ${err.response.data.message || err.response.statusText}`);
    } else {
      console.error(`Pesan: ${err.message}`);
    }
  }
};
