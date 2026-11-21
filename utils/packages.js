const path = require("path");
const fs = require("fs");
const Module = require("module");
const esbuild = require("esbuild");

// Daftar package resmi yang sudah terpasang di server NUDB (/NUDB/package.json)
const SERVER_NUDB_PACKAGES = [
  "appwrite",
  "axios",
  "body-parser",
  "canvas",
  "crypto-js",
  "dotenv",
  "ejs",
  "express",
  "firebase-admin",
  "googleapis",
  "jsoneditor",
  "jsonwebtoken",
  "multer",
  "mysql2",
  "nudbclient",
  "redis",
  "sharp",
  "ws",
];

const BUILTIN_SET = new Set([
  ...Module.builtinModules,
  ...Module.builtinModules.map((m) => `node:${m}`),
]);

const SERVER_PKG_SET = new Set(SERVER_NUDB_PACKAGES);

function getPackageRoot(specifier) {
  if (!specifier) return "";
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split("/")[0];
}

function scanDependencies(code) {
  const specs = new Set();
  const reqRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  const impRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"`]([^'"`]+)['"`]/g;

  let m;
  while ((m = reqRegex.exec(code)) !== null) specs.add(m[1]);
  while ((m = impRegex.exec(code)) !== null) specs.add(m[1]);

  const builtins = [];
  const serverPackages = [];
  const relativeInternal = []; // ../services/*, ../DB/* (internal NUDB)
  const relativeLocal = []; // ./helper (lokal di folder functions)
  const extraPackages = []; // package npm baru di luar NUDB (perlu di-bundle)

  for (const spec of specs) {
    if (spec.startsWith("../")) {
      relativeInternal.push(spec);
    } else if (spec.startsWith("./")) {
      relativeLocal.push(spec);
    } else if (BUILTIN_SET.has(spec)) {
      builtins.push(spec);
    } else {
      const root = getPackageRoot(spec);
      if (SERVER_PKG_SET.has(root)) {
        serverPackages.push(spec);
      } else {
        extraPackages.push(spec);
      }
    }
  }

  return {
    builtins: [...new Set(builtins)].sort(),
    serverPackages: [...new Set(serverPackages)].sort(),
    relativeInternal: [...new Set(relativeInternal)].sort(),
    relativeLocal: [...new Set(relativeLocal)].sort(),
    extraPackages: [...new Set(extraPackages)].sort(),
  };
}

/**
 * Build & bundle function ala Firebase Functions menggunakan esbuild.
 * - Package resmi NUDB, Node built-in, dan import internal NUDB (../...) tetap external.
 * - Package npm baru & helper lokal (./...) otomatis dibundel ke dalam 1 file CJS mandiri.
 */
async function buildFunctionBundle(filePath, options = {}) {
  const absPath = path.resolve(filePath);
  const rawCode = fs.readFileSync(absPath, "utf-8");
  const deps = scanDependencies(rawCode);

  const cliNodeModules = path.resolve(__dirname, "../node_modules");
  const cwdNodeModules = path.resolve(process.cwd(), "node_modules");
  const nodePaths = [cwdNodeModules, cliNodeModules].filter((p) => fs.existsSync(p));

  const externals = [
    ...Module.builtinModules,
    ...Module.builtinModules.map((m) => `node:${m}`),
    ...SERVER_NUDB_PACKAGES,
    ...SERVER_NUDB_PACKAGES.map((p) => `${p}/*`),
  ];

  // Hanya tandai ../... sebagai external jika di-import langsung dari source user (bukan dari dalam node_modules)
  const nudbInternalExternalPlugin = {
    name: "nudb-internal-external",
    setup(build) {
      build.onResolve({ filter: /^\.\.\// }, (args) => {
        if (args.importer && !args.importer.includes(`${path.sep}node_modules${path.sep}`)) {
          return { path: args.path, external: true };
        }
        return null;
      });
    },
  };

  const result = await esbuild.build({
    entryPoints: [absPath],
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node18",
    write: false,
    minify: Boolean(options.minify),
    external: externals,
    nodePaths,
    plugins: [nudbInternalExternalPlugin],
    logLevel: "silent",
  });

  if (!result.outputFiles || result.outputFiles.length === 0) {
    throw new Error("esbuild tidak menghasilkan output file.");
  }

  let bundledCode = result.outputFiles[0].text;

  // Pertahankan header @description jika ada di source asli agar tetap terbaca di Flow Studio
  const jsdocMatch = rawCode.match(/^(\/\*\*[\s\S]*?\*\/)/);
  if (jsdocMatch && !bundledCode.startsWith("/**")) {
    bundledCode = `${jsdocMatch[1]}\n${bundledCode}`;
  }

  return {
    code: bundledCode,
    deps,
    sizeBytes: Buffer.byteLength(bundledCode, "utf-8"),
  };
}

module.exports = {
  SERVER_NUDB_PACKAGES,
  BUILTIN_SET,
  SERVER_PKG_SET,
  getPackageRoot,
  scanDependencies,
  buildFunctionBundle,
};
