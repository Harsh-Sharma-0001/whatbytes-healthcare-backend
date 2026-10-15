const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");

test("GET /health returns an OK status", async () => {
  const server = app.listen(0);
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("unknown route returns JSON 404", async () => {
  const server = app.listen(0);
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/does-not-exist`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.match(body.error, /Route not found/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
