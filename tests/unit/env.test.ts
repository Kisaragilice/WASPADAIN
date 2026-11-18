import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionEnv } from "../../src/lib/env";

const BASE_ENV = {
  NODE_ENV: "production",
  AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db?schema=public",
  APP_URL: "https://waspadain.test",
};

function withEnv(overrides: Record<string, string | undefined>, run: () => void) {
  const keys = [
    "NODE_ENV",
    "AUTH_SECRET",
    "DATABASE_URL",
    "APP_URL",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
  ];
  const saved = new Map(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    Object.assign(process.env, BASE_ENV);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("email sender without an API key keeps the app bootable", () => {
  withEnv({ RESEND_FROM_EMAIL: "WASPADAIN <admin@waspadain.test>" }, () => {
    assert.doesNotThrow(() => assertProductionEnv());
  });
});

test("email API key requires a sender address", () => {
  withEnv({ RESEND_API_KEY: "re_test_key" }, () => {
    assert.throws(() => assertProductionEnv(), /RESEND_FROM_EMAIL/);
  });
});

test("email is accepted when both key and sender are configured", () => {
  withEnv(
    {
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "WASPADAIN <admin@waspadain.test>",
    },
    () => {
      assert.doesNotThrow(() => assertProductionEnv());
    },
  );
});

test("sender must look like an email address", () => {
  withEnv({ RESEND_FROM_EMAIL: "not-an-email" }, () => {
    assert.throws(() => assertProductionEnv(), /alamat email/);
  });
});
