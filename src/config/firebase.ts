import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { env } from "./environment";
import { createLogger } from "../utils/logger";

const logger = createLogger("FirebaseConfig");

let isInitialized = false;

export function initializeFirebase(): { db: admin.firestore.Firestore | null; isLive: boolean } {
  if (isInitialized && admin.apps.length > 0) {
    return { db: admin.firestore(), isLive: true };
  }

  try {
    if (admin.apps.length === 0) {
      if (env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
        const fullPath = path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH);
        const serviceAccount = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        });
        logger.info(`Firebase initialized with service account from ${fullPath}`);
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
        admin.initializeApp();
        logger.info("Firebase initialized with default application credentials");
      } else if (env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          projectId: env.FIREBASE_PROJECT_ID,
        });
        logger.info(`Firebase initialized with Project ID: ${env.FIREBASE_PROJECT_ID}`);
      } else {
        logger.warn("No Firebase credentials or project ID configured. Running in Local/Standalone mode.");
        return { db: null, isLive: false };
      }
    }
    isInitialized = true;
    const db = admin.firestore();
    return { db, isLive: true };
  } catch (error) {
    logger.warn("Failed to initialize Firebase Admin SDK. Fallback to offline memory mode.", error);
    return { db: null, isLive: false };
  }
}

export const { db: firestore, isLive: isFirestoreLive } = initializeFirebase();
