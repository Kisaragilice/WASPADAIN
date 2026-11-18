import { getAppUrl } from "@/lib/env";

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  appUrl: string;
}

function appUrlForEmails(fallbackOrigin?: string) {
  return getAppUrl(fallbackOrigin);
}

/**
 * Email is enabled only when all three values are present. Missing
 * configuration never triggers a network call and never invents a sender.
 */
export function getEmailConfig(fallbackOrigin?: string): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !fromEmail) return null;
  try {
    return {
      apiKey,
      fromEmail,
      appUrl: appUrlForEmails(fallbackOrigin),
    };
  } catch {
    return null;
  }
}

export function isEmailConfigured(fallbackOrigin?: string) {
  return getEmailConfig(fallbackOrigin) !== null;
}
