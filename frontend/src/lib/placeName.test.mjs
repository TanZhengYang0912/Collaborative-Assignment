import test from "node:test";
import assert from "node:assert/strict";
import { shortPlaceName } from "./placeName.js";

test("prefers a named place over the street", () => {
  const result = {
    formatted_address: "Jonker 88, 88 Jalan Hang Jebat, 75200 Melaka, Malaysia",
    address_components: [
      { short_name: "Jonker 88", types: ["point_of_interest", "establishment"] },
      { short_name: "Jalan Hang Jebat", types: ["route"] },
    ],
  };
  assert.equal(shortPlaceName(result), "Jonker 88");
});

test("falls back to the street when there is no named place", () => {
  const result = {
    formatted_address: "12, Jalan Hang Tuah, 75300 Melaka, Malaysia",
    address_components: [
      { short_name: "12", types: ["street_number"] },
      { short_name: "Jalan Hang Tuah", types: ["route"] },
      { short_name: "Melaka", types: ["locality"] },
    ],
  };
  assert.equal(shortPlaceName(result), "Jalan Hang Tuah");
});

test("falls back to the first line of the formatted address", () => {
  const result = { formatted_address: "Bukit Cina, 75100 Melaka, Malaysia", address_components: [] };
  assert.equal(shortPlaceName(result), "Bukit Cina");
});

test("never throws on an empty or missing result", () => {
  assert.equal(shortPlaceName(null), "");
  assert.equal(shortPlaceName({}), "");
});
