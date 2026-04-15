const path = require("path");
const fs = require("fs");

function loadFunction(name) {
  const file = path.join(process.cwd(), "functions", `${name}.js`);

  if (!fs.existsSync(file)) {
    throw new Error("Function not found");
  }

  delete require.cache[require.resolve(file)];
  return require(file);
}

function createMock(reqBody) {
  return {
    req: {
      body: reqBody,
      query: reqBody,
      headers: {}
    },
    res: {
      data: null,
      json(val) {
        this.data = val;
        return val;
      }
    }
  };
}

async function runFunction(name, payload) {
  const fn = loadFunction(name);

  const { req, res } = createMock(payload);

  await fn(req, res);

  return res.data;
}

module.exports = { runFunction };