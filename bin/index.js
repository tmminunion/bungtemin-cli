#!/usr/bin/env node

const { program } = require("commander");
const path = require("path");

const pkg = require(path.join(__dirname, "../package.json"));

program
  .name("bungtemin")
  .version(pkg.version, "-v, --version", "Output the current version")
  .usage("<command> [options]")
  .description("Bungtemin CLI - Serverless Function Management Tool (NUDB & Flow Studio)");

program.addHelpText(
  "after",
  `
Contoh Penggunaan:
  $ bungtemin ui
  $ bungtemin create myFunc --desc "Ambil data anggota"
  $ bungtemin deploy myFunc
  $ bungtemin pull
  $ bungtemin diff
  $ bungtemin packages
  $ bungtemin db-list
  $ bungtemin db-pull --all
  $ bungtemin db-read Absensi --limit 5
  $ bungtemin run myFunc --data '{"key": "value"}'
  $ bungtemin run myFunc --remote --data '{"key": "value"}'
`
);

program
  .command("login")
  .description("Login ke server NUDB")
  .action(require("../commands/login"));

program
  .command("deploy [file]")
  .description("Build (esbuild bundle) & deploy function ke server NUDB")
  .option("--no-bundle", "Deploy kode mentah tanpa esbuild bundle")
  .option("--minify", "Perkecil ukuran hasil bundle", false)
  .action(require("../commands/deploy"));

program
  .command("pull")
  .description("Sync semua functions dari server ke lokal (aman, tidak hapus draft lokal)")
  .option("--clean", "Ikut hapus file lokal yang tidak ada di server", false)
  .action(require("../commands/pull"));

program
  .command("list")
  .description("Tampilkan daftar function yang aktif di server")
  .action(require("../commands/list"));

program
  .command("diff")
  .description("Bandingkan perbedaan kode lokal dengan server / Flow Studio")
  .action(require("../commands/diff"));

program
  .command("packages")
  .description("Tampilkan daftar package bawaan server NUDB (otomatis external saat build)")
  .action(() => {
    const { SERVER_NUDB_PACKAGES } = require("../utils/packages");
    console.log(`\n📦 Package bawaan server NUDB (${SERVER_NUDB_PACKAGES.length}):\n`);
    console.log("  " + SERVER_NUDB_PACKAGES.join(", "));
    console.log(
      "\n💡 Package lain yang di-install di lokal akan otomatis di-bundle oleh esbuild saat 'bungtemin deploy'.\n"
    );
  });

program
  .command("delete <name>")
  .description("Hapus function dari server dan lokal")
  .action(require("../commands/delete"));

program
  .command("create <name>")
  .description("Buat template function baru (Flow Studio & HTTP ready)")
  .option("--auth", "Aktifkan autentikasi", false)
  .option("-d, --desc <text>", "Deskripsi singkat function")
  .action(require("../commands/create"));

program
  .command("db-list")
  .description("Tampilkan daftar JSON DB di server NUDB")
  .action(require("../commands/db-list"));

program
  .command("db-read <name>")
  .description("Baca isi JSON DB langsung di terminal (server atau --local)")
  .option("-l, --local", "Baca dari file lokal data/<name>.json", false)
  .option("--limit <n>", "Batasi jumlah item/key yang ditampilkan")
  .option("-k, --key <field>", "Tampilkan hanya field/key tertentu (contoh: config.version)")
  .action(require("../commands/db-read"));

program
  .command("db-push <file>")
  .description("Upload data JSON DB ke server (smart path: cukup nama DB atau path file)")
  .action(require("../commands/db-push"));

program
  .command("db-pull [name]")
  .description("Download 1 JSON DB atau semua DB (--all / tanpa nama) ke folder data/")
  .option("-a, --all", "Pull semua JSON DB dari server", false)
  .action(require("../commands/db-pull"));

program
  .command("db-create <name> [json]")
  .description("Buat JSON DB baru di server & lokal (default payload: {})")
  .action(require("../commands/db-create"));

program
  .command("db-permit <name>")
  .description("Cek atau atur izin publik read/write JSON DB (/NUDB/permissions/<name>.json)")
  .option("--read <bool>", "Izin publik read (true/false)")
  .option("--write <bool>", "Izin publik write (true/false)")
  .action(require("../commands/db-permit"));

program
  .command("apikey-list")
  .description("Tampilkan daftar API Keys NUDB beserta scope read/write & DB")
  .action(() => require("../commands/apikey").listKeys());

program
  .command("apikey-create")
  .description("Buat API Key baru di NUDB (default aman: read=true, write=false)")
  .option("--key <key>", "API Key custom (kosong = auto-generate 32 karakter)")
  .option("-d, --desc <text>", "Deskripsi API Key")
  .option("--read <bool>", "Izin read (true/false)", "true")
  .option("--write <bool>", "Izin write (true/false)", "false")
  .option("--db <list>", "Batasi DB pisah koma (mis. Absensi,NewMenu; kosong = semua)")
  .action((opts) => require("../commands/apikey").createKey(opts));

program
  .command("apikey-delete <key>")
  .description("Hapus API Key dari NUDB")
  .action((key) => require("../commands/apikey").deleteKey(key));

program
  .command("run <functionName>")
  .description("Eksekusi function (lokal atau --remote di server NUDB)")
  .option("--data <json>", "Payload JSON untuk dikirim ke function")
  .option("-r, --remote", "Eksekusi langsung di server NUDB", false)
  .option("-m, --method <method>", "HTTP method (POST atau GET)", "POST")
  .action(require("../commands/run"));

program
  .command("serve")
  .description("Jalankan emulator server lokal untuk testing")
  .action(require("../commands/serve"));

program
  .command("ai [prompt]")
  .description("Generate atau Edit function menggunakan AI")
  .option("-n, --name <name>", "Nama file function")
  .option("-e, --edit <name>", "Nama file yang ingin diedit")
  .action(require("../commands/ai"));

program
  .command("quis [prompt]")
  .description("Generate quis atau Edit function menggunakan AI")
  .action(require("../commands/aiquis"));

program
  .command("fix <name>")
  .description("Otomatis jalankan dan perbaiki error pada function menggunakan AI")
  .action(require("../commands/fix"));

program
  .command("set-ai-key <key>")
  .description("Simpan Gemini API Key untuk fitur AI")
  .action((key) => {
    const { setConfig } = require("../utils/config");
    setConfig({ ai_key: key });
    console.log("✅ API Key berhasil disimpan!");
  });

program
  .command("set-ai-model <model>")
  .description("Set model Gemini untuk fitur AI (default: gemini-2.5-flash)")
  .action((model) => {
    const { setConfig } = require("../utils/config");
    setConfig({ ai_model: model });
    console.log(`✅ Model AI diset ke: ${model}`);
  });

program
  .command("set-nudb-path <dir>")
  .description("Set folder lokal backup NUDB untuk resolusi modul saat run lokal")
  .action((dir) => {
    const { setConfig } = require("../utils/config");
    const abs = path.resolve(dir);
    setConfig({ nudb_path: abs });
    console.log(`✅ Path NUDB lokal diset ke: ${abs}`);
  });

const flowCmd = program
  .command("flow")
  .description("Cek kesehatan & trigger workflow Bungtemin Flow Studio dari terminal");

flowCmd
  .command("health")
  .description("Cek status NUDB Webhook Engine, WA OTP & Flow Studio")
  .action(() => require("../commands/flow").flowHealth());

flowCmd
  .command("trigger <slug>")
  .description("Trigger Incoming Webhook Flow Studio (POST/GET)")
  .option("-d, --data <json>", "Payload JSON")
  .option("-t, --token <token>", "Webhook Secret Token (X-Webhook-Token)")
  .option("-m, --method <method>", "HTTP method (POST/GET)", "POST")
  .action((slug, opts) => require("../commands/flow").flowTrigger(slug, opts));

program
  .command("ui")
  .description("Buka Terminal UI (Dashboard) untuk manajemen function")
  .action(require("../commands/ui"));

program.on("command:*", function () {
  console.error(
    "Error: Perintah tidak valid: %s\nLihat --help untuk daftar perintah yang tersedia.",
    program.args.join(" ")
  );
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
