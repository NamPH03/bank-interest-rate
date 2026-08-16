import { AlertData } from "../types/alert";
import { firestore } from "../config/firebase";
import { createLogger } from "../utils/logger";

const logger = createLogger("AlertRepository");

export class AlertRepository {
  private memoryAlerts: AlertData[] = [];

  async saveAlert(alert: AlertData): Promise<string> {
    const alertId = alert.id || `alert_${Date.now()}`;
    const alertWithId: AlertData = { ...alert, id: alertId };

    if (firestore) {
      try {
        await firestore.collection("alerts").doc(alertId).set({
          ...alertWithId,
          createdAt: alertWithId.createdAt || new Date(),
        });
        logger.info(`Saved alert ${alertId} to Firestore [level: ${alert.level}]`);
      } catch (error) {
        logger.error(`Failed to save alert ${alertId} to Firestore`, error);
      }
    }

    this.memoryAlerts.push(alertWithId);
    return alertId;
  }

  async getLatestAlert(): Promise<AlertData | null> {
    if (firestore) {
      try {
        const snapshot = await firestore
          .collection("alerts")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          return {
            id: doc.id,
            ...(data as Omit<AlertData, "id">),
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          };
        }
      } catch (error) {
        logger.warn("Could not fetch latest alert from Firestore", error);
      }
    }

    return this.memoryAlerts[this.memoryAlerts.length - 1] || null;
  }

  async getRecentAlerts(withinHours: number): Promise<AlertData[]> {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);

    if (firestore) {
      try {
        const snapshot = await firestore
          .collection("alerts")
          .where("createdAt", ">=", since)
          .orderBy("createdAt", "desc")
          .get();

        if (!snapshot.empty) {
          return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...(data as Omit<AlertData, "id">),
              createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            };
          });
        }
      } catch (error) {
        logger.warn(`Could not fetch recent alerts within ${withinHours}h from Firestore`, error);
      }
    }

    return this.memoryAlerts.filter((a) => new Date(a.createdAt).getTime() >= since.getTime());
  }
}

export const alertRepository = new AlertRepository();
