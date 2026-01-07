import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lifetimeSpend: int("lifetimeSpend").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Appointments table - stores booking information
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  appointmentDate: timestamp("appointmentDate").notNull(),
  appointmentTime: varchar("appointmentTime", { length: 10 }).notNull(), // HH:MM format
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "rescheduled"]).default("pending").notNull(),
  depositPaid: int("depositPaid").default(0).notNull(), // 0 = not paid, 1 = paid
  depositAmount: int("depositAmount").default(2500).notNull(), // in cents ($25 = 2500)
  paymentMethod: varchar("paymentMethod", { length: 50 }), // cash_app, venmo, paypal
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Availability slots table - stores available appointment times
 */
export const availabilitySlots = mysqlTable("availabilitySlots", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Sunday, 6 = Saturday
  startTime: varchar("startTime", { length: 10 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 10 }).notNull(), // HH:MM format
  slotDuration: int("slotDuration").default(60).notNull(), // in minutes
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = typeof availabilitySlots.$inferInsert;

/**
 * Portfolio images table - stores nail art portfolio images
 */
export const portfolioImages = mysqlTable("portfolioImages", {
  id: int("id").autoincrement().primaryKey(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 255 }).notNull(), // S3 key for reference
  title: varchar("title", { length: 255 }),
  description: text("description"),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type InsertPortfolioImage = typeof portfolioImages.$inferInsert;

/**
 * Site content table - stores customizable text for pages
 */
export const siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  contentKey: varchar("contentKey", { length: 100 }).notNull().unique(), // about_text, contact_text, etc.
  contentValue: text("contentValue").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

/**
 * Payments/Deposits table - tracks payment transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  amount: int("amount").notNull(), // in cents
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // cash_app, venmo, paypal
  transactionId: varchar("transactionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Services table - stores nail services and pricing
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  duration: int("duration").notNull(), // in minutes
  isActive: int("isActive").default(1).notNull(),
  productCost: int("productCost").default(0).notNull(), // cost of supplies for this service
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Loyalty stamps table - tracks customer loyalty progress
 */
export const loyaltyStamps = mysqlTable("loyaltyStamps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stampCount: int("stampCount").default(0).notNull(),
  lastStampAt: timestamp("lastStampAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Inventory table - tracks product usage and stock
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // e.g., "bottles", "packs"
  restockThreshold: int("restockThreshold").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * VIP Whitelist table
 */
export const vipWhitelist = mysqlTable("vipWhitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Blocked Dates table
 */
export const blockedDates = mysqlTable("blockedDates", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * User Photos table - stores photos uploaded by users
 */
export const userPhotos = mysqlTable("userPhotos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserPhoto = typeof userPhotos.$inferSelect;
export type InsertUserPhoto = typeof userPhotos.$inferInsert;

/**
 * Advertisements table - stores vendor and affiliate ads
 */
export const advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  linkUrl: text("linkUrl").notNull(),
  adType: mysqlEnum("adType", ["block", "popup"]).default("block").notNull(),
  placement: varchar("placement", { length: 100 }).default("sidebar").notNull(), // sidebar, footer, booking_page
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = typeof advertisements.$inferInsert;

/**
 * Ad Tracking table - tracks impressions and clicks
 */
export const adTracking = mysqlTable("adTracking", {
  id: int("id").autoincrement().primaryKey(),
  adId: int("adId").notNull(),
  eventType: mysqlEnum("eventType", ["impression", "click"]).notNull(),
  userId: int("userId"), // Optional: track which user interacted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdTracking = typeof adTracking.$inferSelect;
export type InsertAdTracking = typeof adTracking.$inferInsert;

/**
 * Financial Settings table
 */
export const financialSettings = mysqlTable("financialSettings", {
  id: int("id").autoincrement().primaryKey(),
  hourlyLaborCost: int("hourlyLaborCost").default(0).notNull(),
  rentPerAppointment: int("rentPerAppointment").default(0).notNull(),
  marketingSpendMonthly: int("marketingSpendMonthly").default(0).notNull(),
  vipSilverThreshold: int("vipSilverThreshold").default(100).notNull(),
  vipGoldThreshold: int("vipGoldThreshold").default(500).notNull(),
  vipVipThreshold: int("vipVipThreshold").default(1000).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialSettings = typeof financialSettings.$inferSelect;
export type InsertFinancialSettings = typeof financialSettings.$inferInsert;

/**
 * Deposit Verification Logs
 */
export const depositLogs = mysqlTable("depositLogs", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // Cash App, Venmo, PayPal
  handle: varchar("handle", { length: 100 }).notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["pending", "matched", "failed", "manual"]).default("pending").notNull(),
  rawLog: text("rawLog"), // For storing raw webhook or scraped data
  matchedAt: timestamp("matchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DepositLog = typeof depositLogs.$inferSelect;
export type InsertDepositLog = typeof depositLogs.$inferInsert;
/**
 * AI Conversation History table
 */
export const aiConversationHistory = mysqlTable("aiConversationHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["system", "user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIConversationHistory = typeof aiConversationHistory.$inferSelect;
export type InsertAIConversationHistory = typeof aiConversationHistory.$inferInsert;

/**
 * AI Settings table
 */
export const aiSettings = mysqlTable("aiSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tone: varchar("tone", { length: 50 }).default("warm").notNull(),
  briefingStyle: varchar("briefingStyle", { length: 50 }).default("short").notNull(),
  reminderTiming: varchar("reminderTiming", { length: 50 }).default("end_of_day").notNull(),
  messageLength: varchar("messageLength", { length: 50 }).default("short").notNull(),
  detailLevel: varchar("detailLevel", { length: 50 }).default("simple").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AISettings = typeof aiSettings.$inferSelect;
export type InsertAISettings = typeof aiSettings.$inferInsert;

/**
 * Daily Briefing Logs table
 */
export const dailyBriefingLogs = mysqlTable("dailyBriefingLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  briefingDate: timestamp("briefingDate").defaultNow().notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyBriefingLog = typeof dailyBriefingLogs.$inferSelect;
export type InsertDailyBriefingLog = typeof dailyBriefingLogs.$inferInsert;

/**
 * Chair/Workspace Rental System
 */
export const rentalSpaces = mysqlTable("rentalSpaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Chair 1", "Pedicure Station"
  hourlyRate: int("hourlyRate").notNull(), // in cents
  isAvailable: int("isAvailable").default(1).notNull(), // 1 for true, 0 for false
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalSpace = typeof rentalSpaces.$inferSelect;
export type InsertRentalSpace = typeof rentalSpaces.$inferInsert;

export const rentalBookings = mysqlTable("rentalBookings", {
  id: int("id").autoincrement().primaryKey(),
  spaceId: int("spaceId").references(() => rentalSpaces.id).notNull(),
  techName: varchar("techName", { length: 255 }).notNull(),
  techEmail: varchar("techEmail", { length: 320 }).notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  totalCost: int("totalCost").notNull(), // in cents
  status: mysqlEnum("status", ["pending", "confirmed", "paid", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalBooking = typeof rentalBookings.$inferSelect;
export type InsertRentalBooking = typeof rentalBookings.$inferInsert;
