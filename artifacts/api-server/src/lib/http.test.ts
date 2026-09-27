import assert from "node:assert/strict";
import test from "node:test";
import { parseId, parsePaging } from "./http";

test("only plain positive integers are accepted as ids", () => {
  assert.equal(parseId("42"), 42);
  assert.equal(parseId("0"), null);
  assert.equal(parseId("-3"), null);
  assert.equal(parseId("1.5"), null);
  assert.equal(parseId("best-sellers"), null);
  assert.equal(parseId(undefined), null);
  assert.equal(parseId(["7", "8"]), 7);
});

test("paging is clamped to a sane window", () => {
  assert.deepEqual(parsePaging("2", "10"), { page: 2, limit: 10, offset: 10 });
  assert.deepEqual(parsePaging("0", "-5"), { page: 1, limit: 1, offset: 0 });
  assert.deepEqual(parsePaging(undefined, "9999"), { page: 1, limit: 100, offset: 0 });
  assert.deepEqual(parsePaging("abc", "abc"), { page: 1, limit: 20, offset: 0 });
});
