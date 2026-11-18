import "server-only";

import { Resend } from "resend";
import { getEmailConfig } from "@/lib/email/config";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";

/**
 * Outcome of an email attempt. Callers must not surface these details to the
 * client: forgot-password always answers with the same generic message so an
 * attacker cannot tell whether an address exists or whether email is enabled.
 */
export type EmailSendResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "not-configured" | "invalid-config" }
  | { status: "failed"; reason: string };

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  token: string;
  expiresInMinutes: number;
  fallbackOrigin?: string;
}): Promise<EmailSendResult> {
  const config = getEmailConfig(input.fallbackOrigin);
  if (!config) {
    // Development without Resend credentials: log the flow but never call the
    // network and never invent a sender address.
    console.info(
      "[email] reset email skipped because Resend is not configured",
    );
    return { status: "skipped", reason: "not-configured" };
  }

  const resetUrl = new URL("/reset-password", config.appUrl);
  resetUrl.searchParams.set("token", input.token);

  const { subject, html, text } = passwordResetEmail({
    name: input.name,
    resetUrl: resetUrl.toString(),
    expiresInMinutes: input.expiresInMinutes,
    appUrl: config.appUrl,
  });

  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.fromEmail,
      to: input.to,
      subject,
      html,
      text,
    });
    if (error) {
      // Log only provider metadata, never the token or the full reset URL.
      console.error("[email] Resend rejected password reset", {
        name: error.name,
        statusCode: error.statusCode,
      });
      return { status: "failed", reason: error.name ?? "provider-error" };
    }
    return { status: "sent" };
  } catch (error) {
    console.error("[email] password reset delivery threw", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: "failed", reason: "network-error" };
  }
}
