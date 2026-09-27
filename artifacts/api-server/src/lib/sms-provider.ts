import { logger } from "./logger";

export interface SmsSendResult {
  providerMessageId: string;
}

export interface SmsProvider {
  readonly name: string;
  send(phone: string, text: string): Promise<SmsSendResult>;
  /** Per-message cost in Toman, for the admin cost report. */
  readonly costPerMessage: number;
}

export class SmsProviderNotConfiguredError extends Error {
  readonly status = 503;

  constructor() {
    super("ارائه‌دهنده پیامک تنظیم نشده است. مقادیر SMS_API_KEY و SMS_SENDER را تنظیم کنید.");
    this.name = "SmsProviderNotConfiguredError";
  }
}

/**
 * Integration point for the SMS gateway.
 *
 * There is no gateway wired up yet, so this returns null and every send is
 * rejected with a 503 instead of being faked. Implement `send` against the
 * chosen Iranian provider (Kavenegar, SMS.ir, …) and return its message id;
 * nothing else in the SMS routes needs to change.
 */
export function getSmsProvider(): SmsProvider | null {
  const apiKey = process.env["SMS_API_KEY"];
  const sender = process.env["SMS_SENDER"];
  if (!apiKey || !sender) return null;

  logger.warn(
    "SMS credentials are set but no provider implementation is wired up; see lib/sms-provider.ts",
  );
  return null;
}
