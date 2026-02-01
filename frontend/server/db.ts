import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, appointments, InsertAppointment, availabilitySlots, InsertAvailabilitySlot, portfolioImages, InsertPortfolioImage, siteContent, InsertSiteContent, payments, InsertPayment, services, InsertService, loyaltyStamps, inventory, vipWhitelist, blockedDates, userPhotos, InsertUserPhoto, advertisements, InsertAdvertisement, adTracking, InsertAdTracking, financialSettings, InsertFinancialSettings, depositLogs, InsertDepositLog, aiConversationHistory, InsertAIConversationHistory, aiSettings, InsertAISettings, dailyBriefingLogs, InsertDailyBriefingLog, rentalSpaces, InsertRentalSpace, rentalBookings, InsertRentalBooking } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserBySyncToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.calendarSyncToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserSyncToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set({ calendarSyncToken: token }).where(eq(users.id, userId));
}

/**
 * Appointments queries
 */
export async function getAppointments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(appointments);
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return result;
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(appointments).set(data).where(eq(appointments.id, id));
}

/**
 * Availability slots queries
 */
export async function getAvailabilitySlots() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(availabilitySlots).where(eq(availabilitySlots.isActive, 1));
}

export async function createAvailabilitySlot(data: InsertAvailabilitySlot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(availabilitySlots).values(data);
}

export async function updateAvailabilitySlot(id: number, data: Partial<InsertAvailabilitySlot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(availabilitySlots).set(data).where(eq(availabilitySlots.id, id));
}

/**
 * Portfolio images queries
 */
export async function getPortfolioImages() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(portfolioImages).orderBy(portfolioImages.displayOrder);
}

export async function createPortfolioImage(data: InsertPortfolioImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(portfolioImages).values(data);
}

export async function updatePortfolioImage(id: number, data: Partial<InsertPortfolioImage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(portfolioImages).set(data).where(eq(portfolioImages.id, id));
}

export async function deletePortfolioImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
}

/**
 * Site content queries
 */
export async function getSiteContent(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteContent).where(eq(siteContent.contentKey, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSiteContent() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(siteContent);
}

export async function upsertSiteContent(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSiteContent(key);
  if (existing) {
    return await db.update(siteContent).set({ contentValue: value }).where(eq(siteContent.contentKey, key));
  } else {
    return await db.insert(siteContent).values({ contentKey: key, contentValue: value });
  }
}

/**
 * Payments queries
 */
export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(payments).values(data);
}

export async function getPaymentByAppointmentId(appointmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.appointmentId, appointmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Services queries
 */
export async function getServices() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(services).where(eq(services.isActive, 1));
}

export async function createService(data: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(services).values(data);
}

export async function updateService(id: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(services).set(data).where(eq(services.id, id));
}

/**
 * Loyalty queries
 */
export async function getLoyaltyStamps(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(loyaltyStamps).where(eq(loyaltyStamps.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function addLoyaltyStamp(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getLoyaltyStamps(userId);
  if (existing) {
    return await db.update(loyaltyStamps).set({ 
      stampCount: existing.stampCount + 1,
      lastStampAt: new Date()
    }).where(eq(loyaltyStamps.userId, userId));
  } else {
    return await db.insert(loyaltyStamps).values({ userId, stampCount: 1, lastStampAt: new Date() });
  }
}

/**
 * Inventory queries
 */
export async function getInventory() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventory);
}

export async function updateInventory(id: number, data: { quantity?: number, restockThreshold?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(inventory).set(data).where(eq(inventory.id, id));
}

/**
 * VIP Whitelist queries
 */
export async function getVipWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vipWhitelist);
}

export async function addToVipWhitelist(email: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(vipWhitelist).values({ email, notes });
}

/**
 * Blocked Dates queries
 */
export async function getBlockedDates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(blockedDates);
}

export async function addBlockedDate(date: Date, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(blockedDates).values({ date, reason });
}

/**
 * User Photos queries
 */
export async function getUserPhotos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(userPhotos).where(eq(userPhotos.userId, userId));
}

export async function createUserPhoto(data: InsertUserPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(userPhotos).values(data);
}

/**
 * Advertisement queries
 */
export async function getAdvertisements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(advertisements).where(eq(advertisements.isActive, 1));
}

export async function getAllAdvertisements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(advertisements);
}

export async function createAdvertisement(data: InsertAdvertisement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(advertisements).values(data);
}

export async function updateAdvertisement(id: number, data: Partial<InsertAdvertisement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(advertisements).set(data).where(eq(advertisements.id, id));
}

/**
 * Ad Tracking queries
 */
export async function trackAdEvent(data: InsertAdTracking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(adTracking).values(data);
}

export async function getAdPerformance() {
  const db = await getDb();
  if (!db) return [];
  // Simplified performance query
  return await db.select().from(adTracking);
}

/**
 * Financial & VIP queries
 */
export async function getFinancialSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(financialSettings).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateFinancialSettings(data: Partial<InsertFinancialSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getFinancialSettings();
  if (existing) {
    return await db.update(financialSettings).set(data).where(eq(financialSettings.id, existing.id));
  } else {
    return await db.insert(financialSettings).values(data as any);
  }
}

export async function updateUserVip(userId: number, data: { vipScore: number, vipTier: any, lifetimeSpend: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set(data).where(eq(users.id, userId));
}

/**
 * Deposit Log queries
 */
export async function getDepositLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(depositLogs).orderBy(desc(depositLogs.createdAt));
}

export async function createDepositLog(data: InsertDepositLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(depositLogs).values(data);
}

export async function updateDepositLog(id: number, data: Partial<InsertDepositLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(depositLogs).set(data).where(eq(depositLogs.id, id));
}

/**
 * AI Queries
 */
export async function getAIHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(aiConversationHistory).where(eq(aiConversationHistory.userId, userId)).orderBy(aiConversationHistory.createdAt);
}

export async function addAIHistory(data: InsertAIConversationHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(aiConversationHistory).values(data);
}

export async function getAISettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiSettings).where(eq(aiSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertAISettings(userId: number, data: Partial<InsertAISettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getAISettings(userId);
  if (existing) {
    return await db.update(aiSettings).set(data).where(eq(aiSettings.userId, userId));
  } else {
    return await db.insert(aiSettings).values({ ...data, userId } as InsertAISettings);
  }
}

export async function getDailyBriefingLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(dailyBriefingLogs).where(eq(dailyBriefingLogs.userId, userId)).orderBy(desc(dailyBriefingLogs.briefingDate));
}

export async function addDailyBriefingLog(data: InsertDailyBriefingLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(dailyBriefingLogs).values(data);
}

/**
 * Rental Space queries
 */
export async function getRentalSpaces() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rentalSpaces).orderBy(rentalSpaces.name);
}

export async function createRentalSpace(data: InsertRentalSpace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(rentalSpaces).values(data);
}

export async function updateRentalSpace(id: number, data: Partial<InsertRentalSpace>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(rentalSpaces).set(data).where(eq(rentalSpaces.id, id));
}

/**
 * Rental Booking queries
 */
export async function getRentalBookings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rentalBookings).orderBy(desc(rentalBookings.startTime));
}

export async function createRentalBooking(data: InsertRentalBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(rentalBookings).values(data);
}

export async function updateRentalBooking(id: number, data: Partial<InsertRentalBooking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(rentalBookings).set(data).where(eq(rentalBookings.id, id));
}
