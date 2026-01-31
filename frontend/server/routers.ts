import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { aiRouter } from "./aiRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  getAvailabilitySlots,
  createAvailabilitySlot,
  updateAvailabilitySlot,
  getPortfolioImages,
  createPortfolioImage,
  updatePortfolioImage,
  deletePortfolioImage,
  getSiteContent,
  getAllSiteContent,
  upsertSiteContent,
  createPayment,
  getPaymentByAppointmentId,
  getServices,
  createService,
  updateService,
  getLoyaltyStamps,
  addLoyaltyStamp,
  getInventory,
  updateInventory,
  getVipWhitelist,
  addToVipWhitelist,
  getBlockedDates,
  addBlockedDate,
  getUserPhotos,
  createUserPhoto,
  getUserByOpenId,
  updateUserSyncToken,
  getAdvertisements,
  getAllAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  trackAdEvent,
  getAdPerformance,
  getFinancialSettings,
  updateFinancialSettings,
  updateUserVip,
  getDepositLogs,
  createDepositLog,
  updateDepositLog,
  getDb,
} from "./db";
import { users } from "../drizzle/schema";
import { createGoogleCalendarEvent } from "./googleCalendar";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  ai: aiRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Appointments router
  appointments: router({
    list: publicProcedure.query(async () => {
      return await getAppointments();
    }),
    getById: publicProcedure.input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).query(async ({ input }) => {
      return await getAppointmentById(input);
    }),
    create: publicProcedure.input((val: unknown) => val as any).mutation(async ({ input }) => {
      return await createAppointment(input);
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      
      // If status is being updated to 'confirmed', sync to Google Calendar
      if (data.status === 'confirmed') {
        const apt = await getAppointmentById(id);
        if (apt) await createGoogleCalendarEvent(apt);
      }

      // If status is being updated to 'completed', handle loyalty and inventory
      if (data.status === 'completed') {
        const apt = await getAppointmentById(id);
        if (apt && apt.status !== 'completed') {
          // 1. Add loyalty stamp
          const user = await getUserByOpenId(apt.customerEmail); // Simplified lookup
          if (user) await addLoyaltyStamp(user.id);
          
          // 2. Deduct inventory based on service type
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
    }),
  }),

  // Availability router
  availability: router({
    list: publicProcedure.query(async () => {
      return await getAvailabilitySlots();
    }),
    create: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createAvailabilitySlot(input);
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateAvailabilitySlot(id, data);
    }),
  }),

  // Portfolio router
  portfolio: router({
    list: publicProcedure.query(async () => {
      return await getPortfolioImages();
    }),
    create: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createPortfolioImage(input);
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updatePortfolioImage(id, data);
    }),
    delete: protectedProcedure.input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await deletePortfolioImage(input);
    }),
  }),

  // Site content router
  content: router({
    get: publicProcedure.input((val: unknown) => {
      if (typeof val === "string") return val;
      throw new Error("Invalid input");
    }).query(async ({ input }) => {
      return await getSiteContent(input);
    }),
    getAll: publicProcedure.query(async () => {
      return await getAllSiteContent();
    }),
    upsert: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { key, value } = input;
      return await upsertSiteContent(key, value);
    }),
  }),

  // Payments router
  payments: router({
    create: publicProcedure.input((val: unknown) => val as any).mutation(async ({ input }) => {
      return await createPayment(input);
    }),
    getByAppointmentId: publicProcedure.input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).query(async ({ input }) => {
      return await getPaymentByAppointmentId(input);
    }),
  }),

  // Services router
  services: router({
    list: publicProcedure.query(async () => {
      return await getServices();
    }),
    create: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createService(input);
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateService(id, data);
    }),
  }),

  // Loyalty router
  loyalty: router({
    getStamps: protectedProcedure.query(async ({ ctx }) => {
      return await getLoyaltyStamps(ctx.user.id);
    }),
    addStamp: protectedProcedure.input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await addLoyaltyStamp(input);
    }),
  }),

  // Rental router
  rental: router({
    listSpaces: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getRentalSpaces();
    }),
    createSpace: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createRentalSpace(input);
    }),
    updateSpace: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateRentalSpace(id, data);
    }),
    listBookings: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getRentalBookings();
    }),
    createBooking: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      // Non-admin users (other techs) can book, but we'll use protectedProcedure for now
      // A more complex system would check for a 'tech' role
      return await createRentalBooking(input);
    }),
    updateBooking: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateRentalBooking(id, data);
    }),
  }),

  // Inventory router
  inventory: router({
    list: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getInventory();
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, quantity, restockThreshold } = input;
      return await updateInventory(id, { quantity, restockThreshold });
    }),
  }),

  // VIP & Blocked Dates router
  admin: router({
    getVipWhitelist: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getVipWhitelist();
    }),
    addToVipWhitelist: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await addToVipWhitelist(input.email, input.notes);
    }),
    getBlockedDates: publicProcedure.query(async () => {
      return await getBlockedDates();
    }),
    addBlockedDate: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await addBlockedDate(new Date(input.date), input.reason);
    }),
    updateVipScores: protectedProcedure.mutation(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const appointments = await getAppointments();
      const usersList = await getDb().then(db => db!.select().from(users));
      const settings = await getFinancialSettings();

      for (const user of usersList) {
        const userApts = appointments.filter(a => a.customerEmail === user.email && a.status === 'completed');
        const lifetimeSpend = userApts.reduce((sum, a: any) => sum + (a.price || 0), 0);
        const visitFrequency = userApts.length;
        const loyaltyPoints = user.vipScore;

        const totalScore = loyaltyPoints + (lifetimeSpend / 10) + (visitFrequency * 5);
        
        let tier: "none" | "silver" | "gold" | "vip" = "none";
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
    getFinancials: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const settings = await getFinancialSettings();
      const bookings = await getRentalBookings();
      const totalRentalIncome = bookings
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.totalCost, 0);

      return {
        ...settings,
        totalRentalIncome,
      };
    }),
    updateFinancials: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await updateFinancialSettings(input);
    }),
    getDepositLogs: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getDepositLogs();
    }),
    verifyDeposit: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, status, appointmentId } = input;
      await updateDepositLog(id, { status, matchedAt: new Date() });
      if (status === "matched") {
        await updateAppointment(appointmentId, { status: "confirmed" });
      }
      return { success: true };
    }),
    triggerAutoVerify: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const logs = await getDepositLogs();
      const pendingLogs = logs.filter(l => l.status === "pending");
      const appointments = await getAppointments();
      const pendingApts = appointments.filter(a => a.status === "pending");

      for (const log of pendingLogs) {
        const match = pendingApts.find(a => 
          a.customerName.toLowerCase().includes(log.handle.toLowerCase()) && 
          Math.abs(new Date(a.createdAt).getTime() - new Date(log.createdAt).getTime()) < 3600000
        );
        if (match) {
          await updateDepositLog(log.id, { status: "matched", appointmentId: match.id, matchedAt: new Date() });
          await updateAppointment(match.id, { status: "confirmed" });
        }
      }
      return { success: true };
    }),
  }),

  // Calendar Sync router
  calendar: router({
    getSyncToken: protectedProcedure.query(async ({ ctx }) => {
      if ((ctx.user as any).calendarSyncToken) return (ctx.user as any).calendarSyncToken;
      const token = nanoid(32);
      await updateUserSyncToken(ctx.user.id, token);
      return token;
    }),
    regenerateToken: protectedProcedure.mutation(async ({ ctx }) => {
      const token = nanoid(32);
      await updateUserSyncToken(ctx.user.id, token);
      return token;
    }),
  }),

  // User Photos router
  photos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPhotos(ctx.user.id);
    }),
    upload: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }) => {
      return await createUserPhoto({
        userId: ctx.user.id,
        imageUrl: input.imageUrl,
        imageKey: input.imageKey,
      });
    }),
  }),



  // Advertisements router
  ads: router({
    list: publicProcedure.query(async () => {
      return await getAdvertisements();
    }),
    listAll: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getAllAdvertisements();
    }),
    create: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await createAdvertisement(input);
    }),
    update: protectedProcedure.input((val: unknown) => val as any).mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateAdvertisement(id, data);
    }),
    track: publicProcedure.input((val: unknown) => val as any).mutation(async ({ input }) => {
      return await trackAdEvent(input);
    }),
    performance: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getAdPerformance();
    }),
  }),
});

export type AppRouter = typeof appRouter;
