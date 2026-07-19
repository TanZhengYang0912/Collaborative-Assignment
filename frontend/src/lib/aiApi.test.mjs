import test from "node:test";
import assert from "node:assert/strict";
import { getAiApiBase } from "./aiApi.js";

test("getAiApiBase uses the local FastAPI service by default", () => {
  assert.equal(getAiApiBase(), "http://localhost:8000/api");
});

test("getAiApiBase normalizes a configured service URL", () => {
  assert.equal(getAiApiBase("http://127.0.0.1:8100"), "http://127.0.0.1:8100/api");
  assert.equal(getAiApiBase("http://127.0.0.1:8100/api/"), "http://127.0.0.1:8100/api");
});
