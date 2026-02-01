// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/oauth.ts
import { COOKIE_NAME as COOKIE_NAME2, ONE_YEAR_MS as ONE_YEAR_MS2 } from "@shared/const";

// server/db.ts
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  calendarSyncToken: varchar("calendarSyncToken", { length: 64 }).unique(),
  vipScore: int("vipScore").default(0).notNull(),
  vipTier: mysqlEnum("vipTier", ["none", "silver", "gold", "vip"]).default("none").notNull(),
  lifetimeSpend: int("lifetimeSpend").default(0).notNull()
});
var appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  appointmentDate: timestamp("appointmentDate").notNull(),
  appointmentTime: varchar("appointmentTime", { length: 10 }).notNull(),
  // HH:MM format
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "rescheduled"]).default("pending").notNull(),
  depositPaid: int("depositPaid").default(0).notNull(),
  // 0 = not paid, 1 = paid
  depositAmount: int("depositAmount").default(2500).notNull(),
  // in cents ($25 = 2500)
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  // cash_app, venmo, paypal
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var availabilitySlots = mysqlTable("availabilitySlots", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(),
  // 0 = Sunday, 6 = Saturday
  startTime: varchar("startTime", { length: 10 }).notNull(),
  // HH:MM format
  endTime: varchar("endTime", { length: 10 }).notNull(),
  // HH:MM format
  slotDuration: int("slotDuration").default(60).notNull(),
  // in minutes
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var portfolioImages = mysqlTable("portfolioImages", {
  id: int("id").autoincrement().primaryKey(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 255 }).notNull(),
  // S3 key for reference
  title: varchar("title", { length: 255 }),
  description: text("description"),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  contentKey: varchar("contentKey", { length: 100 }).notNull().unique(),
  // about_text, contact_text, etc.
  contentValue: text("contentValue").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  amount: int("amount").notNull(),
  // in cents
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
  // cash_app, venmo, paypal
  transactionId: varchar("transactionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  duration: int("duration").notNull(),
  // in minutes
  isActive: int("isActive").default(1).notNull(),
  productCost: int("productCost").default(0).notNull(),
  // cost of supplies for this service
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var loyaltyStamps = mysqlTable("loyaltyStamps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stampCount: int("stampCount").default(0).notNull(),
  lastStampAt: timestamp("lastStampAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  // e.g., "bottles", "packs"
  restockThreshold: int("restockThreshold").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var vipWhitelist = mysqlTable("vipWhitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var blockedDates = mysqlTable("blockedDates", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var userPhotos = mysqlTable("userPhotos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  linkUrl: text("linkUrl").notNull(),
  adType: mysqlEnum("adType", ["block", "popup"]).default("block").notNull(),
  placement: varchar("placement", { length: 100 }).default("sidebar").notNull(),
  // sidebar, footer, booking_page
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var adTracking = mysqlTable("adTracking", {
  id: int("id").autoincrement().primaryKey(),
  adId: int("adId").notNull(),
  eventType: mysqlEnum("eventType", ["impression", "click"]).notNull(),
  userId: int("userId"),
  // Optional: track which user interacted
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var financialSettings = mysqlTable("financialSettings", {
  id: int("id").autoincrement().primaryKey(),
  hourlyLaborCost: int("hourlyLaborCost").default(0).notNull(),
  rentPerAppointment: int("rentPerAppointment").default(0).notNull(),
  marketingSpendMonthly: int("marketingSpendMonthly").default(0).notNull(),
  vipSilverThreshold: int("vipSilverThreshold").default(100).notNull(),
  vipGoldThreshold: int("vipGoldThreshold").default(500).notNull(),
  vipVipThreshold: int("vipVipThreshold").default(1e3).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var depositLogs = mysqlTable("depositLogs", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  // Cash App, Venmo, PayPal
  handle: varchar("handle", { length: 100 }).notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["pending", "matched", "failed", "manual"]).default("pending").notNull(),
  rawLog: text("rawLog"),
  // For storing raw webhook or scraped data
  matchedAt: timestamp("matchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var aiConversationHistory = mysqlTable("aiConversationHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["system", "user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var aiSettings = mysqlTable("aiSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tone: varchar("tone", { length: 50 }).default("warm").notNull(),
  briefingStyle: varchar("briefingStyle", { length: 50 }).default("short").notNull(),
  reminderTiming: varchar("reminderTiming", { length: 50 }).default("end_of_day").notNull(),
  messageLength: varchar("messageLength", { length: 50 }).default("short").notNull(),
  detailLevel: varchar("detailLevel", { length: 50 }).default("simple").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var dailyBriefingLogs = mysqlTable("dailyBriefingLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  briefingDate: timestamp("briefingDate").defaultNow().notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var rentalSpaces = mysqlTable("rentalSpaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // e.g., "Chair 1", "Pedicure Station"
  hourlyRate: int("hourlyRate").notNull(),
  // in cents
  isAvailable: int("isAvailable").default(1).notNull(),
  // 1 for true, 0 for false
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var rentalBookings = mysqlTable("rentalBookings", {
  id: int("id").autoincrement().primaryKey(),
  spaceId: int("spaceId").references(() => rentalSpaces.id).notNull(),
  techName: varchar("techName", { length: 255 }).notNull(),
  techEmail: varchar("techEmail", { length: 320 }).notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  totalCost: int("totalCost").notNull(),
  // in cents
  status: mysqlEnum("status", ["pending", "confirmed", "paid", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserBySyncToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.calendarSyncToken, token)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserSyncToken(userId, token) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set({ calendarSyncToken: token }).where(eq(users.id, userId));
}
async function getAppointments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(appointments);
}
async function getAppointmentById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createAppointment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return result;
}
async function updateAppointment(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(appointments).set(data).where(eq(appointments.id, id));
}
async function getAvailabilitySlots() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(availabilitySlots).where(eq(availabilitySlots.isActive, 1));
}
async function createAvailabilitySlot(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(availabilitySlots).values(data);
}
async function updateAvailabilitySlot(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(availabilitySlots).set(data).where(eq(availabilitySlots.id, id));
}
async function getPortfolioImages() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(portfolioImages).orderBy(portfolioImages.displayOrder);
}
async function createPortfolioImage(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(portfolioImages).values(data);
}
async function updatePortfolioImage(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(portfolioImages).set(data).where(eq(portfolioImages.id, id));
}
async function deletePortfolioImage(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
}
async function getSiteContent(key) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(siteContent).where(eq(siteContent.contentKey, key)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllSiteContent() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(siteContent);
}
async function upsertSiteContent(key, value) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSiteContent(key);
  if (existing) {
    return await db.update(siteContent).set({ contentValue: value }).where(eq(siteContent.contentKey, key));
  } else {
    return await db.insert(siteContent).values({ contentKey: key, contentValue: value });
  }
}
async function createPayment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(payments).values(data);
}
async function getPaymentByAppointmentId(appointmentId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(payments).where(eq(payments.appointmentId, appointmentId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getServices() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(services).where(eq(services.isActive, 1));
}
async function createService(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(services).values(data);
}
async function updateService(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(services).set(data).where(eq(services.id, id));
}
async function getLoyaltyStamps(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(loyaltyStamps).where(eq(loyaltyStamps.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function addLoyaltyStamp(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getLoyaltyStamps(userId);
  if (existing) {
    return await db.update(loyaltyStamps).set({
      stampCount: existing.stampCount + 1,
      lastStampAt: /* @__PURE__ */ new Date()
    }).where(eq(loyaltyStamps.userId, userId));
  } else {
    return await db.insert(loyaltyStamps).values({ userId, stampCount: 1, lastStampAt: /* @__PURE__ */ new Date() });
  }
}
async function getInventory() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventory);
}
async function updateInventory(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(inventory).set(data).where(eq(inventory.id, id));
}
async function getVipWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vipWhitelist);
}
async function addToVipWhitelist(email, notes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(vipWhitelist).values({ email, notes });
}
async function getBlockedDates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(blockedDates);
}
async function addBlockedDate(date, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(blockedDates).values({ date, reason });
}
async function getUserPhotos(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(userPhotos).where(eq(userPhotos.userId, userId));
}
async function createUserPhoto(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(userPhotos).values(data);
}
async function getAdvertisements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(advertisements).where(eq(advertisements.isActive, 1));
}
async function getAllAdvertisements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(advertisements);
}
async function createAdvertisement(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(advertisements).values(data);
}
async function updateAdvertisement(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(advertisements).set(data).where(eq(advertisements.id, id));
}
async function trackAdEvent(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(adTracking).values(data);
}
async function getAdPerformance() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adTracking);
}
async function getFinancialSettings() {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(financialSettings).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateFinancialSettings(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getFinancialSettings();
  if (existing) {
    return await db.update(financialSettings).set(data).where(eq(financialSettings.id, existing.id));
  } else {
    return await db.insert(financialSettings).values(data);
  }
}
async function updateUserVip(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set(data).where(eq(users.id, userId));
}
async function getDepositLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(depositLogs).orderBy(desc(depositLogs.createdAt));
}
async function updateDepositLog(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(depositLogs).set(data).where(eq(depositLogs.id, id));
}
async function getAIHistory(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(aiConversationHistory).where(eq(aiConversationHistory.userId, userId)).orderBy(aiConversationHistory.createdAt);
}
async function addAIHistory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(aiConversationHistory).values(data);
}
async function getAISettings(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(aiSettings).where(eq(aiSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertAISettings(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getAISettings(userId);
  if (existing) {
    return await db.update(aiSettings).set(data).where(eq(aiSettings.userId, userId));
  } else {
    return await db.insert(aiSettings).values({ ...data, userId });
  }
}
async function addDailyBriefingLog(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(dailyBriefingLogs).values(data);
}
async function getRentalBookings2() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rentalBookings).orderBy(desc(rentalBookings.startTime));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/sdk.ts
import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS2
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME2, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS2 });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/routers.ts
import { COOKIE_NAME as COOKIE_NAME3 } from "@shared/const";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/aiRouter.ts
import { z as z2 } from "zod";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/aiRouter.ts
import * as fs from "fs/promises";
var getSystemPrompt = (settings) => {
  const { tone, briefingStyle, reminderTiming, messageLength, detailLevel } = settings;
  const personality = `
    You are the Salon AI assistant for NaildBySteph. Your name is 'Homegirl AI'.
    Your personality is: warm, calm, and supportive, like an older homegirl from Sanger.
    Your cadence is a mix of Valley Girl and Chicana slang. Keep it real, but professional.
    Your primary focus is on workflow and helping Steph manage her business efficiently.
    Keep your responses short, simple, and non-overwhelming.
    
    Examples of your tone:
    - "Hey girl, what's up? Got a quick update for ya."
    - "OMG, that's totally booked! Let's get this bread."
    - "For sure, I got you. Just a quick reminder at the end of the day."
    - "Like, no drama, just the facts."
  `;
  const preferences = `
    Steph's default preferences are:
    - Always prioritize checking deposits first in any financial summary.
    - Keep daily briefings ${briefingStyle}.
    - Send reminders at the ${reminderTiming}.
    - Keep explanations ${detailLevel}.
    - Keep message length ${messageLength}.
  `;
  const adaptiveLearning = `
    You are currently set to:
    - Tone: ${tone}
    - Briefing Style: ${briefingStyle}
    - Reminder Timing: ${reminderTiming}
    - Message Length: ${messageLength}
    - Detail Level: ${detailLevel}

    You may gently adapt your response ONLY in: message length, level of detail, slang/vocabulary, and briefing style.
    DO NOT store or learn personal emotional content.
  `;
  const optionalQuestions = `
    Infrequently and optionally, you may ask one of these questions to adapt your settings:
    - "Do you want these updates shorter or longer?"
    - "You want reminders earlier or later?"
    - "You want me to keep it simple or give you more details?"
  `;
  return [personality, preferences, adaptiveLearning, optionalQuestions].join("\n\n");
};
var chatSchema = z2.object({
  message: z2.string().min(1)
});
var chatProcedure = publicProcedure.input(chatSchema).mutation(async ({ ctx, input }) => {
  if (!ctx.user) {
    throw new Error("User not authenticated");
  }
  const userId = ctx.user.id;
  const settings = await getAISettings(userId) || {
    userId,
    tone: "warm",
    briefingStyle: "short",
    reminderTiming: "end_of_day",
    messageLength: "short",
    detailLevel: "simple"
  };
  if (input.message.toLowerCase().includes("tutorial") || input.message.toLowerCase().includes("help")) {
    const tutorialContent = await fs.readFile("/home/ubuntu/naild_by_steph/project_root/TUTORIAL.md", "utf-8");
    const tutorialMessage = {
      role: "assistant",
      content: `OMG, for sure, girl! Here's the full tea on all the new features. Read this, and let me know if you have any questions, okay? 

${tutorialContent}`
    };
    await addAIHistory({ userId, role: "assistant", content: tutorialMessage.content });
    return { response: tutorialMessage.content };
  }
  const history = await getAIHistory(userId);
  const systemPrompt = getSystemPrompt(settings);
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({
      role: h.role,
      content: h.content
    })),
    { role: "user", content: input.message }
  ];
  const result = await invokeLLM({ messages });
  const aiResponse = result.choices[0].message.content;
  const userMessage = {
    userId,
    role: "user",
    content: input.message
  };
  const assistantMessage = {
    userId,
    role: "assistant",
    content: aiResponse
  };
  await addAIHistory(userMessage);
  await addAIHistory(assistantMessage);
  return {
    response: aiResponse,
    settings
  };
});
var settingsSchema = z2.object({
  tone: z2.string().optional(),
  briefingStyle: z2.enum(["short", "long"]).optional(),
  reminderTiming: z2.enum(["early_morning", "mid_day", "end_of_day"]).optional(),
  messageLength: z2.enum(["short", "long"]).optional(),
  detailLevel: z2.enum(["simple", "detailed"]).optional()
});
var updateSettingsProcedure = adminProcedure.input(settingsSchema).mutation(async ({ ctx, input }) => {
  const userId = ctx.user.id;
  await upsertAISettings(userId, input);
  return getAISettings(userId);
});
var getSettingsProcedure = publicProcedure.query(async ({ ctx }) => {
  if (!ctx.user) {
    return null;
  }
  const userId = ctx.user.id;
  return getAISettings(userId);
});
var dailyBriefingSchema = z2.object({
  date: z2.string().optional()
  // YYYY-MM-DD
});
var dailyBriefingProcedure = adminProcedure.input(dailyBriefingSchema).query(async ({ ctx, input }) => {
  const userId = ctx.user.id;
  const targetDate = input.date ? new Date(input.date) : /* @__PURE__ */ new Date();
  targetDate.setHours(0, 0, 0, 0);
  const allAppointments = await getAppointments();
  const allDeposits = await getDepositLogs();
  const allInventory = await getInventory();
  const allBookings = await getRentalBookings2();
  const todaysAppointments = allAppointments.filter((apt) => {
    const aptDate = new Date(apt.appointmentDate);
    return aptDate.getFullYear() === targetDate.getFullYear() && aptDate.getMonth() === targetDate.getMonth() && aptDate.getDate() === targetDate.getDate();
  });
  const pendingDeposits = allDeposits.filter((d) => d.status === "pending");
  const settings = await getAISettings(userId) || {
    briefingStyle: "short"
  };
  let briefingContent = ``;
  if (pendingDeposits.length > 0) {
    briefingContent += `You have ${pendingDeposits.length} pending deposits to verify.`;
  } else {
    briefingContent += `No pending deposits right now. Slay.`;
  }
  briefingContent += `

`;
  const lowStockItems = allInventory.filter((item) => item.quantity <= item.restockThreshold);
  if (lowStockItems.length > 0) {
    briefingContent += `Heads up, girl! You're running low on supplies. ${lowStockItems.length} items need restocking: ${lowStockItems.map((i) => i.itemName).join(", ")}.`;
  } else {
    briefingContent += `Your inventory is looking good. Everything is stocked up.`;
  }
  briefingContent += `

`;
  const todaysBookings = allBookings.filter((b) => {
    const bookingDate = new Date(b.startTime);
    return bookingDate.getFullYear() === targetDate.getFullYear() && bookingDate.getMonth() === targetDate.getMonth() && bookingDate.getDate() === targetDate.getDate();
  });
  const paidBookings = todaysBookings.filter((b) => b.status === "paid");
  const pendingBookings = todaysBookings.filter((b) => b.status === "pending");
  if (todaysBookings.length > 0) {
    briefingContent += `You have ${todaysBookings.length} rental bookings today. ${paidBookings.length} are paid, and ${pendingBookings.length} are pending payment.`;
  } else {
    briefingContent += `No rental bookings today.`;
  }
  briefingContent += `

`;
  if (todaysAppointments.length > 0) {
    briefingContent += `You have ${todaysAppointments.length} appointments today.`;
    if (settings.briefingStyle === "long") {
      briefingContent += `
- ` + todaysAppointments.map((a) => `${a.customerName} at ${a.appointmentTime}`).join("\n- ");
    }
  } else {
    briefingContent += `You have no appointments scheduled for today.`;
  }
  const systemPrompt = getSystemPrompt(settings);
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Give me my daily briefing for ${targetDate.toLocaleDateString()}. Here is the data:

${briefingContent}` }
  ];
  const result = await invokeLLM({ messages });
  const aiResponse = result.choices[0].message.content;
  const logEntry = {
    userId,
    briefingDate: targetDate,
    content: aiResponse
  };
  await addDailyBriefingLog(logEntry);
  return {
    briefing: aiResponse,
    date: targetDate.toISOString().split("T")[0]
  };
});
var aiRouter = router({
  message: chatProcedure,
  // /api/ai/message
  history: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    return getAIHistory(ctx.user.id);
  }),
  settings: getSettingsProcedure,
  // /api/ai/settings
  updateSettings: updateSettingsProcedure,
  dailyBriefing: dailyBriefingProcedure
  // /api/ai/daily-briefing
});

// server/googleCalendar.ts
import { google } from "googleapis";
async function createGoogleCalendarEvent(appointment) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("[Google Calendar] Skipping event creation: No credentials found.");
    return;
  }
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const start = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.appointmentTime.split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    const event = {
      summary: `Nail Appointment: ${appointment.customerName}`,
      location: "Nail'd by Steph Studio",
      description: `Service: ${appointment.notes || "Nail Service"}`,
      start: {
        dateTime: start.toISOString(),
        timeZone: "America/Los_Angeles"
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "America/Los_Angeles"
      }
    };
    console.log("[Google Calendar] Event would be created for:", appointment.customerName);
  } catch (error) {
    console.error("[Google Calendar] Error creating event:", error);
  }
}

// server/routers.ts
import { nanoid } from "nanoid";
var appRouter = router({
  system: systemRouter,
  ai: aiRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME3, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Appointments router
  appointments: router({
    list: publicProcedure.query(async () => {
      return await getAppointments();
    }),
    getById: publicProcedure.input((val) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).query(async ({ input }) => {
      return await getAppointmentById(input);
    }),
    create: publicProcedure.input((val) => val).mutation(async ({ input }) => {
      return await createAppointment(input);
    }),
    update: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      if (data.status === "confirmed") {
        const apt = await getAppointmentById(id);
        if (apt) await createGoogleCalendarEvent(apt);
      }
      if (data.status === "completed") {
        const apt = await getAppointmentById(id);
        if (apt && apt.status !== "completed") {
          const user = await getUserByOpenId(apt.customerEmail);
          if (user) await addLoyaltyStamp(user.id);
          const items = await getInventory();
          for (const item of items) {
            let deduction = 0;
            if (apt.notes?.includes("FULL SET") && item.itemName.toLowerCase().includes("tips")) deduction = 1;
            if (item.itemName.toLowerCase().includes("monomer")) deduction = 1;
            if (item.itemName.toLowerCase().includes("top coat")) deduction = 1;
            if (deduction > 0 && item.quantity >= deduction) {
              await updateInventory(item.id, { quantity: item.quantity - deduction });
            }
          }
        }
      }
      return await updateAppointment(id, data);
    })
  }),
  // Availability router
  availability: router({
    list: publicProcedure.query(async () => {
      return await getAvailabilitySlots();
    }),
    create: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createAvailabilitySlot(input);
    }),
    update: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateAvailabilitySlot(id, data);
    })
  }),
  // Portfolio router
  portfolio: router({
    list: publicProcedure.query(async () => {
      return await getPortfolioImages();
    }),
    create: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createPortfolioImage(input);
    }),
    update: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updatePortfolioImage(id, data);
    }),
    delete: protectedProcedure.input((val) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await deletePortfolioImage(input);
    })
  }),
  // Site content router
  content: router({
    get: publicProcedure.input((val) => {
      if (typeof val === "string") return val;
      throw new Error("Invalid input");
    }).query(async ({ input }) => {
      return await getSiteContent(input);
    }),
    getAll: publicProcedure.query(async () => {
      return await getAllSiteContent();
    }),
    upsert: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { key, value } = input;
      return await upsertSiteContent(key, value);
    })
  }),
  // Payments router
  payments: router({
    create: publicProcedure.input((val) => val).mutation(async ({ input }) => {
      return await createPayment(input);
    }),
    getByAppointmentId: publicProcedure.input((val) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).query(async ({ input }) => {
      return await getPaymentByAppointmentId(input);
    })
  }),
  // Services router
  services: router({
    list: publicProcedure.query(async () => {
      return await getServices();
    }),
    create: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createService(input);
    }),
    update: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateService(id, data);
    })
  }),
  // Loyalty router
  loyalty: router({
    getStamps: protectedProcedure.query(async ({ ctx }) => {
      return await getLoyaltyStamps(ctx.user.id);
    }),
    addStamp: protectedProcedure.input((val) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await addLoyaltyStamp(input);
    })
  }),
  // Rental router
  rental: router({
    listSpaces: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getRentalSpaces();
    }),
    createSpace: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createRentalSpace(input);
    }),
    updateSpace: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateRentalSpace(id, data);
    }),
    listBookings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getRentalBookings();
    }),
    createBooking: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      return await createRentalBooking(input);
    }),
    updateBooking: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateRentalBooking(id, data);
    })
  }),
  // Inventory router
  inventory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getInventory();
    }),
    update: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, quantity, restockThreshold } = input;
      return await updateInventory(id, { quantity, restockThreshold });
    })
  }),
  // VIP & Blocked Dates router
  admin: router({
    getVipWhitelist: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getVipWhitelist();
    }),
    addToVipWhitelist: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await addToVipWhitelist(input.email, input.notes);
    }),
    getBlockedDates: publicProcedure.query(async () => {
      return await getBlockedDates();
    }),
    addBlockedDate: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await addBlockedDate(new Date(input.date), input.reason);
    }),
    updateVipScores: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const appointments2 = await getAppointments();
      const usersList = await getDb().then((db) => db.select().from(users));
      const settings = await getFinancialSettings();
      for (const user of usersList) {
        const userApts = appointments2.filter((a) => a.customerEmail === user.email && a.status === "completed");
        const lifetimeSpend = userApts.reduce((sum, a) => sum + (a.price || 0), 0);
        const visitFrequency = userApts.length;
        const loyaltyPoints = user.vipScore;
        const totalScore = loyaltyPoints + lifetimeSpend / 10 + visitFrequency * 5;
        let tier = "none";
        if (settings) {
          if (totalScore >= settings.vipVipThreshold) tier = "vip";
          else if (totalScore >= settings.vipGoldThreshold) tier = "gold";
          else if (totalScore >= settings.vipSilverThreshold) tier = "silver";
        }
        await updateUserVip(user.id, {
          vipScore: Math.floor(totalScore),
          vipTier: tier,
          lifetimeSpend
        });
      }
      return { success: true };
    }),
    getFinancials: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const settings = await getFinancialSettings();
      const bookings = await getRentalBookings();
      const totalRentalIncome = bookings.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.totalCost, 0);
      return {
        ...settings,
        totalRentalIncome
      };
    }),
    updateFinancials: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await updateFinancialSettings(input);
    }),
    getDepositLogs: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getDepositLogs();
    }),
    verifyDeposit: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, status, appointmentId } = input;
      await updateDepositLog(id, { status, matchedAt: /* @__PURE__ */ new Date() });
      if (status === "matched") {
        await updateAppointment(appointmentId, { status: "confirmed" });
      }
      return { success: true };
    }),
    triggerAutoVerify: protectedProcedure.input((val) => val).mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const logs = await getDepositLogs();
      const pendingLogs = logs.filter((l) => l.status === "pending");
      const appointments2 = await getAppointments();
      const pendingApts = appointments2.filter((a) => a.status === "pending");
      for (const log of pendingLogs) {
        const match = pendingApts.find(
          (a) => a.customerName.toLowerCase().includes(log.handle.toLowerCase()) && Math.abs(new Date(a.createdAt).getTime() - new Date(log.createdAt).getTime()) < 36e5
        );
        if (match) {
          await updateDepositLog(log.id, { status: "matched", appointmentId: match.id, matchedAt: /* @__PURE__ */ new Date() });
          await updateAppointment(match.id, { status: "confirmed" });
        }
      }
      return { success: true };
    })
  }),
  // Calendar Sync router
  calendar: router({
    getSyncToken: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.calendarSyncToken) return ctx.user.calendarSyncToken;
      const token = nanoid(32);
      await updateUserSyncToken(ctx.user.id, token);
      return token;
    }),
    regenerateToken: protectedProcedure.mutation(async ({ ctx }) => {
      const token = nanoid(32);
      await updateUserSyncToken(ctx.user.id, token);
      return token;
    })
  }),
  // User Photos router
  photos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPhotos(ctx.user.id);
    }),
    upload: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      return await createUserPhoto({
        userId: ctx.user.id,
        imageUrl: input.imageUrl,
        imageKey: input.imageKey
      });
    })
  }),
  // Advertisements router
  ads: router({
    list: publicProcedure.query(async () => {
      return await getAdvertisements();
    }),
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getAllAdvertisements();
    }),
    create: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createAdvertisement(input);
    }),
    update: protectedProcedure.input((val) => val).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateAdvertisement(id, data);
    }),
    track: publicProcedure.input((val) => val).mutation(async ({ input }) => {
      return await trackAdEvent(input);
    }),
    performance: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getAdPerformance();
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "NaildBy_Steph",
        short_name: "NBS",
        description: "Nail tech booking and showcase app",
        theme_color: "#ff69b4",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@server": path.resolve(__dirname, "./server"),
      "@drizzle": path.resolve(__dirname, "./drizzle")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./client/styles/global.scss";`
      }
    }
  },
  server: {
    port: 3e3
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/calendar.ts
import { Router } from "express";
import ical from "ical-generator";
var calendarRouter = Router();
calendarRouter.get("/feed/:token", async (req, res) => {
  const { token } = req.params;
  const user = await getUserBySyncToken(token);
  if (!user) {
    return res.status(404).send("Invalid sync token");
  }
  const appointments2 = await getAppointments();
  const userAppointments = user.role === "admin" ? appointments2 : appointments2.filter((apt) => apt.customerEmail === user.email);
  const calendar = ical({ name: "Nail'd by Steph Appointments" });
  userAppointments.forEach((apt) => {
    const start = new Date(apt.appointmentDate);
    const [hours, minutes] = apt.appointmentTime.split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    calendar.createEvent({
      start,
      end,
      summary: `Nail Appointment: ${apt.customerName}`,
      description: `Service: ${apt.notes || "Nail Service"}
Status: ${apt.status}`,
      location: "Nail'd by Steph Studio",
      url: "https://naildbysteph.beauty"
    });
  });
  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="appointments.ics"');
  res.send(calendar.toString());
});
var calendar_default = calendarRouter;

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  app.use("/calendar", calendar_default);
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
