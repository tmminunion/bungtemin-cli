const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());

function loadFunction(name) {
  const file = path.join(process.cwd(), "functions", `${name}.js`);

  if (!fs.existsSync(file)) {
    throw new Error("Function not found");
  }

  delete require.cache[require.resolve(file)];
  return require(file);
}

// ==========================
// 🚀 RUN FUNCTION VIA HTTP
// ==========================
app.all("/functions/:name", async (req, res) => {
  try {
    const fn = loadFunction(req.params.name);

    const mockReq = {
      body: req.body,
      query: req.query,
      headers: req.headers,
      params: req.params
    };

    const mockRes = {
      data: null,
      json(data) {
        this.data = data;
        return res.json(data);
      },
      send(data) {
        this.data = data;
        return res.send(data);
      }
    };

    await fn(mockReq, mockRes);

    if (!mockRes.data) {
      return res.json({ success: true });
    }

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/functions-ui", (req, res) => {
  const fs = require("fs");
  const path = require("path");

  const dir = path.join(process.cwd(), "functions");

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".js"))
    .map(f => f.replace(".js", ""));

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Bungtemin Emulator</title>
  <style>
    body { font-family: Arial; background:#0f172a; color:white; padding:20px; }
    .card { padding:10px; margin:10px; background:#1e293b; border-radius:10px; cursor:pointer; }
    .card:hover { background:#334155; }
    pre { background:#000; padding:10px; border-radius:10px; }
  </style>
</head>
<body>

<h2>🔥 Bungtemin Emulator Functions</h2>

<div id="list"></div>

<h3>Response</h3>
<pre id="output">Klik function untuk test...</pre>

<script>
const functions = ${JSON.stringify(files)};

const list = document.getElementById("list");
const output = document.getElementById("output");

functions.forEach(fn => {
  const div = document.createElement("div");
  div.className = "card";
  div.innerText = "⚡ " + fn;

  div.onclick = async () => {
    output.innerText = "Running " + fn + "...";

    const res = await fetch("/functions/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true })
    });

    const data = await res.json();
    output.innerText = JSON.stringify(data, null, 2);
  };

  list.appendChild(div);
});
</script>

</body>
</html>
  `);
});
// ==========================
// START SERVER
// ==========================
const PORT = 4040;

app.listen(PORT, () => {
  console.log(`🔥 Bungtemin Emulator running on http://localhost:${PORT}`);
});