import assert from "node:assert/strict";
import test from "node:test";
import {
  clamp,
  percentage,
  sanitizeNextPath,
} from "../../src/lib/utils";

test("sanitizeNextPath accepts same-origin relative paths", () => {
  assert.equal(sanitizeNextPath("/simulasi"), "/simulasi");
  assert.equal(sanitizeNextPath("/hasil/abc?tab=1#x"), "/hasil/abc?tab=1#x");
  assert.equal(sanitizeNextPath("/kab/pre-test"), "/kab/pre-test");
});

test("sanitizeNextPath rejects external and protocol-relative targets", () => {
  assert.equal(sanitizeNextPath("https://evil.example"), undefined);
  assert.equal(sanitizeNextPath("//evil.example"), undefined);
  assert.equal(sanitizeNextPath("/\\evil.example"), undefined);
  assert.equal(sanitizeNextPath("\\\\evil.example"), undefined);
  assert.equal(sanitizeNextPath("javascript:alert(1)"), undefined);
  assert.equal(sanitizeNextPath("simulasi"), undefined);
});

test("sanitizeNextPath rejects control characters and oversized input", () => {
  assert.equal(sanitizeNextPath("/simulasi\nLocation: https://evil"), undefined);
  assert.equal(sanitizeNextPath(`/${"a".repeat(600)}`), undefined);
  assert.equal(sanitizeNextPath(null), undefined);
  assert.equal(sanitizeNextPath(undefined), undefined);
});

test("sanitizeNextPath uses the fallback when input is unsafe", () => {
  assert.equal(sanitizeNextPath("https://evil.example", "/masuk"), "/masuk");
  assert.equal(sanitizeNextPath(undefined, "/masuk"), "/masuk");
});

test("sanitizeNextPath drops credentials encoded in a relative URL", () => {
  assert.equal(sanitizeNextPath("/@evil.example"), "/@evil.example");
  assert.equal(sanitizeNextPath("//user:pass@evil.example"), undefined);
});

test("clamp and percentage handle edge cases", () => {
  assert.equal(clamp(-10), 0);
  assert.equal(clamp(110), 100);
  assert.equal(clamp(42), 42);
  assert.equal(clamp(50, 20, 80), 50);
  assert.equal(percentage(0, 0), 0);
  assert.equal(percentage(1, 3), 33);
  assert.equal(percentage(3, 3), 100);
});
