const blessed = require("blessed");
const fs = require("fs");
const path = require("path");

module.exports = function () {
  // 1. Inisialisasi Screen
  const screen = blessed.screen({
    smartCSR: true,
    title: "Bungtemin Emulator UI",
    cursor: {
      artificial: true,
      shape: 'line',
      blink: true,
      color: null
    }
  });

  const dir = path.join(process.cwd(), "functions");

  // Pastikan folder functions ada agar tidak error saat readdirSync
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".js"))
    .map(f => f.replace(".js", ""));

  // 2. Komponen List (Menu Sebelah Kiri)
  const list = blessed.list({
    top: 0,
    left: 0,
    width: "30%",
    height: "100%",
    label: " Functions ",
    items: files,
    border: { type: "line" },
    keys: true,       // Mengaktifkan navigasi panah keyboard
    mouse: true,      // Mengaktifkan klik mouse
    style: {
      selected: {
        bg: "blue",
        fg: "white"
      },
      border: {
        fg: "#f0f0f0"
      }
    }
  });

  // 3. Komponen Output (Panel Sebelah Kanan)
  const output = blessed.box({
    top: 0,
    left: "30%",
    width: "70%",
    height: "100%",
    label: " Response ",
    border: { type: "line" },
    scrollable: true,
    alwaysScroll: true,
    content: "Pilih fungsi di sebelah kiri dan tekan ENTER...",
    style: {
      border: {
        fg: "#f0f0f0"
      }
    }
  });

  screen.append(list);
  screen.append(output);

  // 4. Logika Menjalankan Fungsi
  function runFunction(name) {
    if (!name) return;
    
    const filePath = path.join(dir, name + ".js");
    output.setContent(`Executing: ${name}...\n---`);
    screen.render();

    try {
      // Hapus cache agar jika file .js diubah, hasilnya langsung terupdate
      delete require.cache[require.resolve(filePath)];
      const fn = require(filePath);

      const mockReq = {
        body: {},
        query: {},
        params: {},
        headers: {}
      };

      const mockRes = {
        json(data) {
          output.setContent(JSON.stringify(data, null, 2));
          screen.render();
        },
        send(data) {
          output.setContent(String(data));
          screen.render();
        },
        end: () => screen.render()
      };

      // Panggil fungsi
      if (typeof fn === 'function') {
        fn(mockReq, mockRes);
      } else {
        output.setContent(`Error: File ${name}.js tidak mengekspor function (module.exports = function...).`);
      }

    } catch (err) {
      output.setContent(`Error executing function:\n\n${err.stack}`);
    }

    screen.render();
  }

  // 5. Event Handlers
  
  // Event saat item dipilih (tekan Enter)
  list.on("select", (item) => {
    const selectedName = item.getText();
    runFunction(selectedName);
  });

  // Shortcut keluar aplikasi (ESC, q, atau Ctrl+C)
  screen.key(["escape", "q", "C-c"], () => {
    return process.exit(0);
  });

  // Memastikan fokus awal ada pada list agar bisa langsung navigasi
  list.focus();

  // Render awal
  screen.render();
};
