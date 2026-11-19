/**
 * Sends a test email through Resend from the terminal, using exactly the same
 * RESEND_API_KEY / RESEND_FROM_EMAIL values as the running application.
 *
 *   npm run email:test -- you@example.com
 *   npm run email:test -- --to you@example.com
 *   npm run email:test -- --to you@example.com --dry-run
 *   npm run email:test -- --to you@example.com --from "WASPADAIN <no-reply@domain.id>"
 *
 * `--from` is useful to try another verified sender without editing .env.
 *
 * In Docker:
 *   docker compose --env-file .env.docker run --rm app \
 *     npm run email:test -- you@example.com
 *
 * The script exits non-zero when Resend rejects the request, so it is safe to
 * use in a deployment checklist.
 */
import { Resend } from "resend";

function loadEnv() {
  const file = process.env.ENV_FILE?.trim() || ".env";
  const loader = (
    process as NodeJS.Process & { loadEnvFile?: (path?: string) => void }
  ).loadEnvFile;
  if (typeof loader !== "function") return;
  try {
    loader(file);
  } catch {
    // Missing .env is fine in Docker, where variables come from the container.
  }
}

function argValue(name: string) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function positionalRecipient() {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--to" || arg === "--from") {
      index += 1; // Skip the option value.
      continue;
    }
    if (!arg.startsWith("-")) return arg;
  }
  return undefined;
}

function maskKey(value: string) {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

async function main() {
  loadEnv();

  const dryRun = process.argv.includes("--dry-run");
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const from = argValue("--from")?.trim() || envFrom;
  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
  const to =
    argValue("--to")?.trim() ||
    positionalRecipient() ||
    process.env.RESEND_TEST_TO?.trim();

  if (!apiKey || !from) {
    throw new Error(
      "RESEND_API_KEY dan RESEND_FROM_EMAIL wajib diisi. Periksa .env / .env.docker.",
    );
  }
  if (!to || !to.includes("@")) {
    throw new Error(
      "Alamat tujuan wajib. Contoh: npm run email:test -- you@example.com",
    );
  }

  console.log("Resend configuration:", {
    apiKey: maskKey(apiKey),
    from,
    to,
    appUrl,
    dryRun,
  });

  if (dryRun) {
    console.log("Dry run: email tidak dikirim.");
    return;
  }

  const resend = new Resend(apiKey);
  const sentAt = new Date().toISOString();
  const { data, error } = await resend.emails.send(
    {
      from,
      to,
      subject: "WASPADAIN — tes email Resend",
      text: [
        "Tes pengiriman email WASPADAIN berhasil.",
        "",
        `Waktu server: ${sentAt}`,
        `APP_URL: ${appUrl}`,
        "",
        "Email ini dikirim manual dari terminal server melalui Resend.",
        "Tidak ada tindakan yang diperlukan.",
      ].join("\n"),
      html: `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#FBF8EF;font-family:Arial,Helvetica,sans-serif;color:#101B2D;">
    <div style="max-width:520px;margin:32px auto;background:#FFFFFF;border-radius:20px;padding:28px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#0F7E70;">WASPADAIN · Resend</p>
      <h1 style="margin:0 0 12px;font-size:24px;">Tes email berhasil</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4B5563;">
        Email ini dikirim manual dari terminal server untuk memverifikasi konfigurasi Resend.
      </p>
      <p style="margin:0;font-size:12px;line-height:1.7;color:#6B7280;">
        Waktu server: ${sentAt}<br />
        APP_URL: ${appUrl}
      </p>
    </div>
  </body>
</html>`,
    },
    { idempotencyKey: `waspadain-test-${Date.now()}` },
  );

  if (error) {
    console.error("Resend menolak permintaan:", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
    if (
      error.statusCode === 403 ||
      /not authorized|invalid_from_address/i.test(error.message ?? "")
    ) {
      console.error(
        "Petunjuk: pastikan domain pada RESEND_FROM_EMAIL sudah terverifikasi di dashboard Resend dan API key tidak dibatasi ke domain lain. Coba pengirim lain dengan --from.",
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log("Email diterima Resend:", { id: data?.id, to });
  console.log("Periksa inbox/spam penerima untuk memastikan pengiriman end-to-end.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
