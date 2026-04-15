#!/usr/bin/env node

const { program } = require("commander");

// 1. Konfigurasi Version dengan alias -v
const path = require("path"); 

// Pastikan jalurnya benar: naik satu folder dari 'bin' ke root
const pkg = require(path.join(__dirname, "../package.json"));

program
  .name("bungtemin")
  .version(pkg.version, "-v, --version", "Output the current version")
  .usage("<command> [options]")
  .description("Bungtemin CLI - Serverless Function Management Tool");
// 2. Menambahkan custom text pada help (Opsional)
program.addHelpText('after', `
Contoh Penggunaan:
  $ bungtemin ui
  $ bungtemin deploy myFunction.js
  $ bungtemin run myFunction --data '{"key": "value"}'
`);

program
  .command("login")
  .description("Login ke server")
  .action(require("../commands/login"));

program
  .command("deploy <file>")
  .description("Deploy function ke server")
  .action(require("../commands/deploy"));

program
  .command("pull")
  .description("Sync semua functions dari server ke lokal")
  .action(require("../commands/pull"));
  
program
  .command("list")
  .description("Tampilkan daftar function yang aktif di server")
  .action(require("../commands/list"));
  
program
  .command("diff")
  .description("Bandingkan perbedaan kode lokal dengan server")
  .action(require("../commands/diff"));

program
  .command("delete <name>")
  .description("Hapus function dari server")
  .action(require("../commands/delete"));

program
  .command("create <name>")
  .description("Buat template function baru")
  .option("--auth", "Aktifkan autentikasi", false) // Menambahkan flag --auth
  .action(require("../commands/create"));

program
  .command("db-push <file>")
  .description("Upload skema/data database ke server")
  .action(require("../commands/db-push"));

program
  .command("db-pull <name>")
  .description("Download data database dari server")
  .action(require("../commands/db-pull"));
  
program
  .command("db-create <name> <json>")
  .description("Buat database baru dengan payload JSON")
  .action(require("../commands/db-create"));
  
program
  .command("run <functionName>")
  .description("Eksekusi function secara remote")
  .option("--data <json>", "Payload JSON untuk dikirim ke function")
  .action(require("../commands/run"));

program
  .command("serve")
  .description("Jalankan server lokal untuk testing")
  .action(require("../commands/serve"));

program
  .command("ai [prompt]") // prompt jadi opsional jika pakai --edit
  .description("Generate atau Edit function menggunakan AI")
  .option("-n, --name <name>", "Nama file function")
  .option("-e, --edit <name>", "Nama file yang ingin diedit")
  .action(require("../commands/ai"));

program
  .command("fix <name>")
  .description("Otomatis jalankan dan perbaiki error pada function menggunakan AI")
  .action(require("../commands/fix"));


program
  .command("set-ai-key <key>")
  .description("Simpan Gemini API Key untuk fitur AI")
  .action((key) => {
    const { setConfig } = require("../utils/config");
    setConfig({ ai_key: key }); // Sekarang fungsi ini sudah ada
    console.log("✅ API Key berhasil disimpan!");
  });

program
  .command("ui")
  .description("Buka Terminal UI (Dashboard) untuk manajemen function")
  .action(require("../commands/ui"));

// 3. Menangani perintah yang tidak dikenal
program.on('command:*', function () {
  console.error('Error: Perintah tidak valid: %s\nLihat --help untuk daftar perintah yang tersedia.', program.args.join(' '));
  process.exit(1);
});

program.parse(process.argv);

// Jika tidak ada argumen yang dimasukkan, tampilkan help secara otomatis
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
