import assert from "node:assert/strict";
import test from "node:test";
import { toCsv } from "./csv";

test("commas and quotes are escaped", () => {
  const csv = toCsv(["name"], [['علی, "نمونه"']]);
  assert.equal(csv, '﻿name\r\n"علی, ""نمونه"""');
});

test("formula-like values are neutralised", () => {
  const csv = toCsv(["value"], [["=1+1"], ["+A1"], ["-2"], ["@x"]]);
  assert.equal(csv, "﻿value\r\n'=1+1\r\n'+A1\r\n'-2\r\n'@x");
});

test("empty values stay empty", () => {
  assert.equal(toCsv(["a", "b"], [[null, undefined]]), "﻿a,b\r\n,");
});
