import { Resend } from "resend";
import { NotificationService, SendResult } from "./EmailService";
import { AlertData } from "../../types/alert";
import { env } from "../../config/environment";
import { alertRepository } from "../../repositories/AlertRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger("ResendEmailService");

export class ResendEmailService implements NotificationService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
    }
  }

  async sendAlert(alert: AlertData): Promise<SendResult> {
    const recipient = env.EMAIL_TO;

    if (!recipient) {
      logger.warn("EMAIL_TO environment variable is not configured. Email suppressed (Dry Run).");
      console.log("\n================ [EMAIL DRY RUN] ================");
      console.log(`Subject: ${alert.emailSubject}`);
      console.log(`To: (Not configured)`);
      console.log(`Body:\n${alert.emailBodyText}`);
      console.log("==================================================\n");

      // Save dry run alert to database
      await alertRepository.saveAlert({
        ...alert,
        emailSent: false,
        error: "EMAIL_TO not configured",
      });

      return { success: true, messageId: "dry_run" };
    }

    if (!this.resend || !env.RESEND_API_KEY) {
      logger.warn("RESEND_API_KEY is not configured. Email printed to console.");
      console.log("\n================ [EMAIL SIMULATION] ================");
      console.log(`Subject: ${alert.emailSubject}`);
      console.log(`To: ${recipient}`);
      console.log(`From: ${env.EMAIL_FROM}`);
      console.log(`Body:\n${alert.emailBodyText}`);
      console.log("=====================================================\n");

      await alertRepository.saveAlert({
        ...alert,
        emailSent: true,
        emailRecipient: recipient,
        emailMessageId: "simulated_local",
      });

      return { success: true, messageId: "simulated_local" };
    }

    try {
      logger.info(`Sending alert email to ${recipient}...`);
      const response = await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to: recipient,
        subject: alert.emailSubject,
        text: alert.emailBodyText,
        html: alert.emailBodyHtml,
      });

      if (response.error) {
        logger.error(`Resend API error: ${response.error.message}`, response.error);
        await alertRepository.saveAlert({
          ...alert,
          emailSent: false,
          emailRecipient: recipient,
          error: response.error.message,
        });
        return { success: false, error: response.error.message };
      }

      const messageId = response.data?.id;
      logger.info(`Email sent successfully via Resend. Message ID: ${messageId}`);

      await alertRepository.saveAlert({
        ...alert,
        emailSent: true,
        emailRecipient: recipient,
        emailMessageId: messageId,
      });

      return { success: true, messageId };
    } catch (error: any) {
      logger.error("Failed to send email via Resend", error);
      await alertRepository.saveAlert({
        ...alert,
        emailSent: false,
        emailRecipient: recipient,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }
}

export const emailService = new ResendEmailService();
