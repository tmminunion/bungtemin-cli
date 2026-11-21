const express = require("express");
const path = require("path");
const fs = require("fs");
const { loadFunction } = require("./runner");

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ==========================
// 🚀 RUN FUNCTION VIA HTTP
// ==========================
app.all("/functions/:name", async (req, res) => {
  try {
    const fn = loadFunction(req.params.name);

    const mockReq = {
      method: req.method,
      body: req.body || {},
      query: req.query || {},
      headers: req.headers || {},
      params: req.params || {},
    };

    let statusCode = 200;
    const mockRes = {
      sent: false,
      status(code) {
        statusCode = Number(code) || 200;
        return this;
      },
      set(key, val) {
        if (typeof key === "object" && key !== null) {
          Object.entries(key).forEach(([k, v]) => res.setHeader(k, v));
        } else if (key) {
          res.setHeader(key, val);
        }
        return this;
      },
      setHeader(key, val) {
        res.setHeader(key, val);
        return this;
      },
      header(key, val) {
        return this.set(key, val);
      },
      type(val) {
        res.type(val);
        return this;
      },
      json(data) {
        if (this.sent || res.headersSent) return this;
        this.sent = true;
        res.status(statusCode).json(data);
        return this;
      },
      send(data) {
        if (this.sent || res.headersSent) return this;
        this.sent = true;
        res.status(statusCode).send(data);
        return this;
      },
      end(data) {
        if (this.sent || res.headersSent) return this;
        this.sent = true;
        res.status(statusCode).end(data);
        return this;
      },
    };

    const ret = await fn(mockReq, mockRes);

    if (!mockRes.sent && !res.headersSent) {
      return res.status(statusCode).json(ret !== undefined ? ret : { success: true });
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
});

app.get("/functions-ui", (req, res) => {
  const dir = path.join(process.cwd(), "functions");
  const files = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".js"))
        .map((f) => f.replace(/\.js$/, ""))
    : [];

  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Bungtemin Emulator</title>
  <style>
    body { font-family: system-ui, sans-serif; background:#0f172a; color:#f8fafc; padding:20px; max-width:900px; margin:0 auto; }
    .grid { display:grid; grid-template-columns:260px 1fr; gap:16px; }
    .card { padding:10px 12px; margin-bottom:8px; background:#1e293b; border-radius:8px; cursor:pointer; font-size:14px; }
    .card:hover { background:#334155; }
    textarea { width:100%; height:110px; background:#020617; color:#e2e8f0; border:1px solid #334155; border-radius:8px; padding:10px; font-family:monospace; box-sizing:border-box; }
    pre { background:#020617; padding:12px; border-radius:8px; border:1px solid #334155; overflow:auto; min-height:140px; }
    label { display:block; font-size:12px; color:#94a3b8; margin-bottom:6px; }
  </style>
</head>
<body>
  <h2>Bungtemin Local Emulator</h2>
  <div class="grid">
    <div>
      <label>Functions (${files.length})</label>
      <div id="list"></div>
    </div>
    <div>
      <label>Payload JSON (POST Body)</label>
      <textarea id="payload">{\n  "test": true\n}</textarea>
      <label style="margin-top:12px;">Response</label>
      <pre id="output">Klik function di kiri untuk test...</pre>
    </div>
  </div>
  <script>
    const functions = ${JSON.stringify(files)};
    const list = document.getElementById("list");
    const output = document.getElementById("output");
    const payloadEl = document.getElementById("payload");

    functions.forEach(fn => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerText = "⚡ " + fn;
      div.onclick = async () => {
        output.innerText = "Running " + fn + "...";
        let bodyObj = {};
        try {
          bodyObj = JSON.parse(payloadEl.value || "{}");
        } catch (e) {
          output.innerText = "JSON Payload tidak valid: " + e.message;
          return;
        }
        try {
          const res = await fetch("/functions/" + encodeURIComponent(fn), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyObj)
          });
          const text = await res.text();
          try {
            output.innerText = "HTTP " + res.status + "\\n" + JSON.stringify(JSON.parse(text), null, 2);
          } catch (_) {
            output.innerText = "HTTP " + res.status + "\\n" + text;
          }
        } catch (err) {
          output.innerText = "Error: " + err.message;
        }
      };
      list.appendChild(div);
    });
  </script>
</body>
</html>`);
});

// ==========================
// START SERVER
// ==========================
const PORT = Number(process.env.PORT) || 4040;

app.listen(PORT, () => {
  console.log(`🔥 Bungtemin Emulator running on http://localhost:${PORT}`);
  console.log(`🖥️  UI Tester: http://localhost:${PORT}/functions-ui`);
});
