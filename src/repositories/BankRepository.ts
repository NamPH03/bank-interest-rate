import { Bank } from "../types/bank";
import { INITIAL_BANKS } from "../config/constants";
import { firestore } from "../config/firebase";
import { createLogger } from "../utils/logger";

const logger = createLogger("BankRepository");

export class BankRepository {
  private localBanks: Map<string, Bank> = new Map();

  constructor() {
    // Populate in-memory fallback cache
    for (const seed of INITIAL_BANKS) {
      this.localBanks.set(seed.id, {
        ...seed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async getAllActiveBanks(): Promise<Bank[]> {
    if (firestore) {
      try {
        const snapshot = await firestore
          .collection("banks")
          .where("isActive", "==", true)
          .get();

        if (!snapshot.empty) {
          return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Bank, "id">),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
          }));
        }
      } catch (error) {
        logger.warn("Could not fetch banks from Firestore, using default seeds", error);
      }
    }
    return Array.from(this.localBanks.values()).filter((b) => b.isActive);
  }

  async getBankById(bankId: string): Promise<Bank | null> {
    if (firestore) {
      try {
        const doc = await firestore.collection("banks").doc(bankId).get();
        if (doc.exists) {
          const data = doc.data()!;
          return {
            id: doc.id,
            ...(data as Omit<Bank, "id">),
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          };
        }
      } catch (error) {
        logger.warn(`Could not fetch bank ${bankId} from Firestore`, error);
      }
    }
    return this.localBanks.get(bankId) || null;
  }

  async seedInitialBanks(): Promise<void> {
    if (!firestore) {
      logger.info("Firestore not connected, seeded in memory.");
      return;
    }

    const batch = firestore.batch();
    for (const bank of INITIAL_BANKS) {
      const docRef = firestore.collection("banks").doc(bank.id);
      batch.set(
        docRef,
        {
          ...bank,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }
    await batch.commit();
    logger.info(`Seeded ${INITIAL_BANKS.length} initial banks into Firestore`);
  }
}

export const bankRepository = new BankRepository();
