const blessed = require("blessed");
const fs = require("fs");
const path = require("path");
const { runFunctionDetailed } = require("../emulator/runner");

module.exports = function () {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Bungtemin Emulator UI",
    cursor: {
      artificial: true,
      shape: "line",
      blink: true,
      color: null,
    },
  });

  const dir = path.join(process.cwd(), "functions");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => f.replace(/\.js$/, ""));

  const list = blessed.list({
    top: 0,
    left: 0,
    width: "30%",
    height: "100%",
    label: ` Functions (${files.length}) `,
    items: files,
    border: { type: "line" },
    keys: true,
    mouse: true,
    style: {
      selected: {
        bg: "blue",
        fg: "white",
      },
      border: {
        fg: "#f0f0f0",
      },
    },
  });

  const output = blessed.box({
    top: 0,
    left: "30%",
    width: "70%",
    height: "100%",
    label: " Response (ESC/q untuk keluar) ",
    border: { type: "line" },
    scrollable: true,
    alwaysScroll: true,
    content: "Pilih fungsi di sebelah kiri dan tekan ENTER...",
    style: {
      border: {
        fg: "#f0f0f0",
      },
    },
  });

  screen.append(list);
  screen.append(output);

  async function executeSelected(name) {
    if (!name) return;

    output.setContent(`Executing: ${name}...\n`);
    screen.render();

    try {
      const result = await runFunctionDetailed(name, {}, { method: "POST" });
      const bodyStr =
        typeof result.data === "object"
          ? JSON.stringify(result.data, null, 2)
          : String(result.data ?? "");
      output.setContent(`HTTP ${result.statusCode}\n\n${bodyStr}`);
    } catch (err) {
      output.setContent(`Error executing function '${name}':\n\n${err.stack || err.message}`);
    }

    screen.render();
  }

  list.on("select", (item) => {
    const selectedName = item.getText();
    executeSelected(selectedName);
  });

  screen.key(["escape", "q", "C-c"], () => process.exit(0));

  list.focus();
  screen.render();
};
