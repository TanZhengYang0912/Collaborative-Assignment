import test from "node:test";
import assert from "node:assert/strict";
import { paginate, pageNumbers } from "./pagination.js";

test("paginate slices items and clamps an out-of-range page", () => {
  const items = Array.from({ length: 25 }, (_, index) => index + 1);

  assert.deepEqual(paginate(items, 2, 12), {
    page: 2,
    totalPages: 3,
    total: 25,
    items: Array.from({ length: 12 }, (_, index) => index + 13),
  });

  assert.equal(paginate(items, 99, 12).page, 3);
  assert.deepEqual(paginate(items, 99, 12).items, [25]);
});

test("pageNumbers keeps pagination compact while preserving the ends", () => {
  assert.deepEqual(pageNumbers(1, 3), [1, 2, 3]);
  assert.deepEqual(pageNumbers(8, 20), [1, "ellipsis", 7, 8, 9, "ellipsis", 20]);
});
