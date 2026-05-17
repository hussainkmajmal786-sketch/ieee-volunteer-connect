const crypto = require("node:crypto");
const admin = require("firebase-admin");
const { FirestoreAdminClient } = require("@google-cloud/firestore").v1;
const { Storage } = require("@google-cloud/storage");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();

const db = admin.firestore();
const storage = new Storage();
const firestoreAdmin = new FirestoreAdminClient();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LINK_CLICK_LIMIT_PER_WINDOW = 10;

function requireString(value, field, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new HttpsError("invalid-argument", `${field} is required`);
  }
  return value.trim();
}

function optionalString(value, maxLength) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new HttpsError("invalid-argument", "Invalid string field");
  }
  return value.trim();
}

function validateEmail(value) {
  const email = requireString(value, "email", 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Invalid email");
  }
  return email;
}

function safeFieldKey(value) {
  if (!value) return null;
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

function clientIp(request) {
  const forwarded = request.rawRequest?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return request.rawRequest?.ip || "unknown";
}

function hashSubject(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 48);
}

exports.registerForEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before registering for events");
  }

  const eventId = requireString(request.data?.eventId, "eventId", 128);
  const form = request.data?.form || {};
  const registration = {
    userId: request.auth.uid,
    name: requireString(form.name, "name", 100),
    email: validateEmail(form.email),
    phone: requireString(form.phone, "phone", 40),
    college: requireString(form.college, "college", 160),
    year: requireString(form.year, "year", 40),
    eventId,
    registeredAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const referredBy = safeFieldKey(request.data?.referredBy);
  if (referredBy) registration.referredBy = referredBy;

  const eventRef = db.collection("events").doc(eventId);
  const regRef = eventRef.collection("registrations").doc(request.auth.uid);

  await db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found");
    }

    const existingUserReg = await tx.get(regRef);
    if (existingUserReg.exists) {
      throw new HttpsError("already-exists", "You are already registered for this event");
    }

    const duplicateEmailQuery = eventRef
      .collection("registrations")
      .where("email", "==", registration.email)
      .limit(1);
    const duplicateEmailSnap = await tx.get(duplicateEmailQuery);
    if (!duplicateEmailSnap.empty) {
      throw new HttpsError("already-exists", "This email is already registered for this event");
    }

    const eventUpdate = {
      participants: admin.firestore.FieldValue.increment(1),
    };
    if (referredBy) {
      eventUpdate[`refCounts.${referredBy}`] = admin.firestore.FieldValue.increment(1);
    }

    tx.set(regRef, registration);
    tx.update(eventRef, eventUpdate);
  });

  return { ok: true };
});

exports.recordLinkClick = onCall(async (request) => {
  const now = Date.now();
  const uid = request.auth?.uid || null;
  const subject = uid ? `uid_${uid}` : `ip_${hashSubject(clientIp(request))}`;
  const rateRef = db.collection("rateLimits").doc("linkClicks").collection("subjects").doc(subject);

  const eventType = requireString(request.data?.eventType || "event", "eventType", 64);
  const payload = {
    eventType,
    source: optionalString(request.data?.source, 128),
    medium: optionalString(request.data?.medium, 64),
    campaign: optionalString(request.data?.campaign, 128),
    page: optionalString(request.data?.page, 256),
    element: optionalString(request.data?.element, 128),
    eventId: optionalString(request.data?.eventId, 128),
    eventName: optionalString(request.data?.eventName, 200),
    refId: optionalString(request.data?.refId, 128),
    sessionId: optionalString(request.data?.sessionId, 128),
    device: optionalString(request.data?.device, 40),
    userId: uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.runTransaction(async (tx) => {
    const rateSnap = await tx.get(rateRef);
    const rate = rateSnap.exists ? rateSnap.data() : {};
    const windowStart = rate.windowStartMs || 0;
    const count = rate.count || 0;
    const inWindow = now - windowStart < RATE_LIMIT_WINDOW_MS;

    if (inWindow && count >= LINK_CLICK_LIMIT_PER_WINDOW) {
      throw new HttpsError("resource-exhausted", "Too many tracking events. Try again later.");
    }

    tx.set(rateRef, {
      windowStartMs: inWindow ? windowStart : now,
      count: inWindow ? count + 1 : 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.set(db.collection("linkClicks").doc(), payload);
  });

  return { ok: true };
});

exports.scheduledFirestoreExport = onSchedule("every 24 hours", async () => {
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error("Missing project id");
  }

  const bucketName = `${projectId}-firestore-backups`;
  const [exists] = await storage.bucket(bucketName).exists();
  if (!exists) {
    await storage.createBucket(bucketName, {
      location: "US",
      uniformBucketLevelAccess: true,
    });
  }

  const databaseName = firestoreAdmin.databasePath(projectId, "(default)");
  const date = new Date().toISOString().slice(0, 10);
  await firestoreAdmin.exportDocuments({
    name: databaseName,
    outputUriPrefix: `gs://${bucketName}/${date}`,
    collectionIds: [],
  });
});
