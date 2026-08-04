import test from "node:test";
import assert from "node:assert/strict";
import { isAdminUser } from "./customerAccess.js";

test("identifies an admin by the service-controlled role", () => {
  assert.equal(isAdminUser({ app_metadata: { role: "admin" } }), true);
  assert.equal(isAdminUser({ app_metadata: { role: "superadmin" } }), false);
  assert.equal(isAdminUser({ app_metadata: {} }), false);
});

test("is false for missing users rather than throwing", () => {
  assert.equal(isAdminUser(null), false);
  assert.equal(isAdminUser(undefined), false);
  assert.equal(isAdminUser({}), false);
});

test("ignores user_metadata, which the account holder can edit", () => {
  assert.equal(isAdminUser({ app_metadata: {}, user_metadata: { role: "admin" } }), false);
});
