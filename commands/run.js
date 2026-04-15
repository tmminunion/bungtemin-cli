const { runFunction } = require("../emulator/runner");

module.exports = async (functionName, options) => {
  try {
    console.log(`🚀 Running local function: ${functionName}`);

    let payload = {};

    if (options.data) {
      payload = JSON.parse(options.data);
    }

    const result = await runFunction(functionName, payload);

    console.log("✅ Result:");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
};