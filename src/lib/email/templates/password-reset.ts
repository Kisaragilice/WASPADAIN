export interface PasswordResetEmailInput {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
  appUrl: string;
}

export function passwordResetEmail({
  name,
  resetUrl,
  expiresInMinutes,
  appUrl,
}: PasswordResetEmailInput) {
  const displayName = name.trim() || "Warga WASPADAIN";
  const subject = "Atur ulang kata sandi WASPADAIN";
  const preheader = "Tautan atur ulang kata sandi berlaku sekali dan akan kedaluwarsa.";
  const safeUrl = escapeHtml(resetUrl);

  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${subject}</title>
    <style>
      @media (max-width: 600px) {
        .container { width: 100% !important; border-radius: 0 !important; }
        .px { padding-left: 22px !important; padding-right: 22px !important; }
        .cta { display: block !important; width: 100% !important; text-align: center !important; }
        .h1 { font-size: 24px !important; line-height: 1.2 !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#FBF8EF;color:#101B2D;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FBF8EF;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="560" cellspacing="0" cellpadding="0" style="width:560px;max-width:560px;background:#FFFFFF;border-radius:28px;overflow:hidden;box-shadow:0 18px 40px rgba(16,27,45,0.08);">
            <tr>
              <td class="px" style="padding:28px 34px 12px 34px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:42px;height:42px;border-radius:14px;background:#0F7E70;text-align:center;vertical-align:middle;">
                      <span style="display:inline-block;color:#FFFFFF;font-size:20px;font-weight:800;line-height:42px;">W</span>
                    </td>
                    <td style="padding-left:12px;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#101B2D;">WASPADAIN</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:10px 34px 0 34px;">
                <p style="margin:0 0 10px 0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#0F7E70;">Keamanan akun</p>
                <h1 class="h1" style="margin:0;font-size:30px;line-height:1.18;letter-spacing:-0.04em;color:#101B2D;">Atur ulang kata sandi</h1>
                <p style="margin:14px 0 0 0;font-size:14px;line-height:1.7;color:#4B5563;">Halo ${escapeHtml(displayName)}, kami menerima permintaan untuk mengatur ulang kata sandi akun WASPADAIN Anda.</p>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:24px 34px 0 34px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3FBF8;border:1px solid #CDEDE4;border-radius:20px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0;font-size:13px;line-height:1.7;color:#0B5E54;">Tautan ini hanya berlaku <strong>${expiresInMinutes} menit</strong> dan hanya dapat dipakai satu kali. Jika Anda tidak meminta reset, abaikan email ini — kata sandi tidak berubah.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:24px 34px 0 34px;">
                <a class="cta" href="${safeUrl}" style="display:inline-block;background:#0F7E70;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:800;padding:14px 24px;border-radius:999px;">Buat kata sandi baru</a>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:22px 34px 0 34px;">
                <p style="margin:0;font-size:11px;line-height:1.7;color:#6B7280;">Tombol tidak berfungsi? Salin tautan berikut ke browser:</p>
                <p style="margin:6px 0 0 0;font-size:11px;line-height:1.6;word-break:break-all;color:#0F7E70;">${safeUrl}</p>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:26px 34px 30px 34px;">
                <div style="height:1px;background:#EEF0F3;margin-bottom:18px;"></div>
                <p style="margin:0;font-size:11px;line-height:1.7;color:#6B7280;">WASPADAIN tidak pernah meminta PIN, OTP, atau kata sandi melalui email. Seluruh simulasi memakai data sintetis.</p>
                <p style="margin:10px 0 0 0;font-size:10px;line-height:1.6;color:#9CA3AF;">Email otomatis dari ${escapeHtml(appUrl)} · Jangan balas email ini.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "WASPADAIN — Atur ulang kata sandi",
    "",
    `Halo ${displayName},`,
    "",
    "Kami menerima permintaan mengatur ulang kata sandi akun WASPADAIN Anda.",
    `Buka tautan berikut (berlaku ${expiresInMinutes} menit, sekali pakai):`,
    resetUrl,
    "",
    "Jika Anda tidak meminta reset, abaikan email ini. Kata sandi tidak berubah.",
    "WASPADAIN tidak pernah meminta PIN, OTP, atau kata sandi melalui email.",
    "",
    appUrl,
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
