const path = require("path");
const fs = require("fs");
const Module = require("module");
const { getConfig } = require("../utils/config");
const { SERVER_PKG_SET, getPackageRoot } = require("../utils/packages");

const CLI_NODE_MODULES = path.resolve(__dirname, "../node_modules");

/**
 * Resolve require() dengan fallback ke:
 * 1. node_modules folder kerja saat ini
 * 2. node_modules bawaan bungtemin-cli
 * 3. node_modules / path backup NUDB (jika user set `bungtemin set-nudb-path <dir>`)
 */
function withFallbackResolver(fn) {
  const originalResolve = Module._resolveFilename;
  const config = getConfig();
  const extraPaths = [];

  const cwdModules = path.resolve(process.cwd(), "node_modules");
  if (fs.existsSync(cwdModules)) extraPaths.push(cwdModules);
  if (fs.existsSync(CLI_NODE_MODULES)) extraPaths.push(CLI_NODE_MODULES);

  const nudbRoot = config.nudb_path ? path.resolve(config.nudb_path) : null;
  if (nudbRoot && fs.existsSync(path.join(nudbRoot, "node_modules"))) {
    extraPaths.push(path.join(nudbRoot, "node_modules"));
  }

  Module._resolveFilename = function (request, parent, isMain, options) {
    try {
      return originalResolve.call(this, request, parent, isMain, options);
    } catch (err) {
      // 1. Jika import relatif internal NUDB (../services/*, ../DB/*) dan nudb_path diset
      if (request.startsWith("../") && nudbRoot) {
        const mapped = path.resolve(nudbRoot, "functions", request);
        try {
          return originalResolve.call(this, mapped, parent, isMain, options);
        } catch (_) {}
      }

      // 2. Cari di extraPaths (cwd/node_modules, bungtemin-cli/node_modules, nudb/node_modules)
      for (const base of extraPaths) {
        try {
          return originalResolve.call(this, request, parent, isMain, {
            ...(options || {}),
            paths: [base],
          });
        } catch (_) {}
      }

      // 3. Perkaya pesan error agar user langsung tahu keputusan yang harus diambil
      if (err && err.code === "MODULE_NOT_FOUND") {
        if (request.startsWith("../")) {
          const hint = new Error(
            `Module internal server NUDB '${request}' tidak ada di lokal.\n` +
              `💡 Jalankan di server: bungtemin run <name> --remote\n` +
              `   atau arahkan backup NUDB lokal: bungtemin set-nudb-path <folder-nudb>`
          );
          hint.code = "MODULE_NOT_FOUND";
          throw hint;
        }

        const rootPkg = getPackageRoot(request);
        const onServer = SERVER_PKG_SET.has(rootPkg);
        const hint = new Error(
          onServer
            ? `Package '${rootPkg}' ada di server NUDB tapi belum terinstall di lokal.\n` +
                `💡 Jalankan di server: bungtemin run <name> --remote\n` +
                `   atau install lokal untuk testing: npm install ${rootPkg}`
            : `Package baru '${rootPkg}' belum terinstall di lokal (dan belum ada di server NUDB).\n` +
                `💡 Install di lokal dulu: npm install ${rootPkg}\n` +
                `   Saat 'bungtemin deploy', package ini akan otomatis di-bundle oleh esbuild agar jalan di NUDB.`
        );
        hint.code = "MODULE_NOT_FOUND";
        throw hint;
      }

      throw err;
    }
  };

  try {
    return fn();
  } finally {
    Module._resolveFilename = originalResolve;
  }
}

function loadFunction(name) {
  const cleanName = String(name || "").replace(/\.js$/, "");
  const file = path.join(process.cwd(), "functions", `${cleanName}.js`);

  if (!fs.existsSync(file)) {
    throw new Error(`Function '${cleanName}' tidak ditemukan di functions/${cleanName}.js`);
  }

  return withFallbackResolver(() => {
    delete require.cache[require.resolve(file)];
    const fn = require(file);
    if (typeof fn !== "function") {
      throw new Error(
        `File functions/${cleanName}.js tidak mengekspor function (module.exports = async (req, res) => ...)`
      );
    }
    return fn;
  });
}

function createMock(payload = {}, options = {}) {
  const method = String(options.method || "POST").toUpperCase();
  const req = {
    method,
    body: payload && typeof payload === "object" ? { ...payload } : {},
    query: payload && typeof payload === "object" ? { ...payload } : {},
    params: options.params || {},
    headers: options.headers || { "content-type": "application/json" },
  };

  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    sent: false,
    status(code) {
      this.statusCode = Number(code) || 200;
      return this;
    },
    set(key, val) {
      if (typeof key === "object" && key !== null) {
        Object.assign(this.headers, key);
      } else if (key) {
        this.headers[String(key).toLowerCase()] = val;
      }
      return this;
    },
    setHeader(key, val) {
      return this.set(key, val);
    },
    header(key, val) {
      return this.set(key, val);
    },
    type(val) {
      return this.set("content-type", val);
    },
    json(val) {
      this.data = val;
      this.sent = true;
      return this;
    },
    send(val) {
      this.data = val;
      this.sent = true;
      return this;
    },
    end(val) {
      if (val !== undefined && !this.sent) {
        this.data = val;
      }
      this.sent = true;
      return this;
    },
  };

  return { req, res };
}

async function runFunctionDetailed(name, payload = {}, options = {}) {
  const fn = loadFunction(name);
  const { req, res } = createMock(payload, options);

  const ret = await withFallbackResolver(() => fn(req, res));

  return {
    statusCode: res.statusCode,
    headers: res.headers,
    data: res.sent ? res.data : ret !== undefined ? ret : res.data,
  };
}

async function runFunction(name, payload = {}, options = {}) {
  const result = await runFunctionDetailed(name, payload, options);
  return result.data;
}

module.exports = { runFunction, runFunctionDetailed, createMock, loadFunction };
