import { AlertData } from "../../types/alert";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationService {
  sendAlert(alert: AlertData): Promise<SendResult>;
}
