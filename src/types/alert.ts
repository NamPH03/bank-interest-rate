import { MarketDirection, SignalLevel, TermChangeSummary } from "./signal";

export type AlertType = "MARKET_INCREASE" | "MARKET_DECREASE";

export interface AlertData {
  id?: string;
  alertType: AlertType;
  direction: MarketDirection;
  signalScore: number;
  trendScore: number;
  level: SignalLevel;
  summary: string;
  termHighlights: TermChangeSummary[];
  emailSubject: string;
  emailBodyText: string;
  emailBodyHtml: string;
  emailSent: boolean;
  emailRecipient?: string;
  emailMessageId?: string;
  createdAt: Date;
  error?: string;
}
