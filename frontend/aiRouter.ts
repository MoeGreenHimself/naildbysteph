import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { invokeLLM, Message } from "./_core/llm";
import { getAIHistory, addAIHistory, getAISettings, upsertAISettings, getAppointments, getDepositLogs, addDailyBriefingLog, getInventory, getRentalBookings } from "./db";
import * as fs from 'fs/promises';
import { InsertAIConversationHistory, InsertAISettings, InsertDailyBriefingLog } from "../drizzle/schema";

// --- AI Personality System Prompt ---
const getSystemPrompt = (settings: InsertAISettings) => {
  const { tone, briefingStyle, reminderTiming, messageLength, detailLevel } = settings;

  // Personality: Warm, calm, supportive “older homegirl from Sanger” tone. Valley Girl x Chicana cadence.
  // Workflow: Workflow-focused personality.
  // Preferences: Steph checks deposits first. Likes daily briefings short. Prefers reminders at the end of the day. Does not like long explanations.

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

  return [personality, preferences, adaptiveLearning, optionalQuestions].join('\n\n');
};

// --- AI Conversation Handler ---
const chatSchema = z.object({
  message: z.string().min(1),
});

const chatProcedure = publicProcedure
  .input(chatSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }
    const userId = ctx.user.id;

    // 1. Get AI Settings (or use defaults)
    const settings = await getAISettings(userId) || {
      userId,
      tone: "warm",
      briefingStyle: "short",
      reminderTiming: "end_of_day",
      messageLength: "short",
      detailLevel: "simple",
    };

    // 2. Get Conversation History
    const history = await getAIHistory(userId);

    // 3. Construct LLM Messages
    const systemPrompt = getSystemPrompt(settings);
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...history.map(h => ({
        role: h.role as Message["role"],
        content: h.content,
      })),
      { role: "user", content: input.message },
    ];

    // 4. Invoke LLM
    const result = await invokeLLM({ messages });
    const aiResponse = result.choices[0].message.content as string;

    // 5. Save History
    const userMessage: InsertAIConversationHistory = {
      userId,
      role: "user",
      content: input.message,
    };
    const assistantMessage: InsertAIConversationHistory = {
      userId,
      role: "assistant",
      content: aiResponse,
    };

    await addAIHistory(userMessage);
    await addAIHistory(assistantMessage);

    return {
      response: aiResponse,
      settings,
    };
  });

// --- AI Settings Handler ---
const settingsSchema = z.object({
  tone: z.string().optional(),
  briefingStyle: z.enum(["short", "long"]).optional(),
  reminderTiming: z.enum(["early_morning", "mid_day", "end_of_day"]).optional(),
  messageLength: z.enum(["short", "long"]).optional(),
  detailLevel: z.enum(["simple", "detailed"]).optional(),
});

const updateSettingsProcedure = adminProcedure
  .input(settingsSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    await upsertAISettings(userId, input);
    return getAISettings(userId);
  });

const getSettingsProcedure = publicProcedure
  .query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }
    const userId = ctx.user.id;
    return getAISettings(userId);
  });

// --- Daily Briefing Engine (Placeholder) ---
// This will be expanded in the next step (Phase 4)
const dailyBriefingSchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD
});

const dailyBriefingProcedure = adminProcedure
  .input(dailyBriefingSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const targetDate = input.date ? new Date(input.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // 1. Get data for briefing
    const allAppointments = await getAppointments();
    const allDeposits = await getDepositLogs();
    const allInventory = await getInventory();
    const allBookings = await getRentalBookings();

    const todaysAppointments = allAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.getFullYear() === targetDate.getFullYear() &&
             aptDate.getMonth() === targetDate.getMonth() &&
             aptDate.getDate() === targetDate.getDate();
    });

    const pendingDeposits = allDeposits.filter(d => d.status === 'pending');

    // 2. Get AI Settings for personalization
    const settings = await getAISettings(userId) || {
      briefingStyle: "short",
    };

    // 3. Construct briefing content
    let briefingContent = ``;

    // Deposits first (as per Steph's preference)
    if (pendingDeposits.length > 0) {
      briefingContent += `You have ${pendingDeposits.length} pending deposits to verify.`;
    } else {
      briefingContent += `No pending deposits right now. Slay.`;
    }

    briefingContent += `\n\n`;

    // Inventory Restock Alert
    const lowStockItems = allInventory.filter(item => item.quantity <= item.restockThreshold);
    if (lowStockItems.length > 0) {
      briefingContent += `Heads up, girl! You're running low on supplies. ${lowStockItems.length} items need restocking: ${lowStockItems.map(i => i.itemName).join(', ')}.`;
    } else {
      briefingContent += `Your inventory is looking good. Everything is stocked up.`;
    }

    briefingContent += `\n\n`;

    // Rental Bookings
    const todaysBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.startTime);
      return bookingDate.getFullYear() === targetDate.getFullYear() &&
             bookingDate.getMonth() === targetDate.getMonth() &&
             bookingDate.getDate() === targetDate.getDate();
    });
    const paidBookings = todaysBookings.filter(b => b.status === 'paid');
    const pendingBookings = todaysBookings.filter(b => b.status === 'pending');

    if (todaysBookings.length > 0) {
      briefingContent += `You have ${todaysBookings.length} rental bookings today. ${paidBookings.length} are paid, and ${pendingBookings.length} are pending payment.`;
    } else {
      briefingContent += `No rental bookings today.`;
    }

    briefingContent += `\n\n`;

    // Today's appointments
    if (todaysAppointments.length > 0) {
      briefingContent += `You have ${todaysAppointments.length} appointments today.`;
      if (settings.briefingStyle === 'long') {
        briefingContent += `\n- ` + todaysAppointments.map(a => `${a.customerName} at ${a.appointmentTime}`).join('\n- ');
      }
    } else {
      briefingContent += `You have no appointments scheduled for today.`;
    }

    // 4. Generate AI response using the briefing content
    const systemPrompt = getSystemPrompt(settings as InsertAISettings);
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Give me my daily briefing for ${targetDate.toLocaleDateString()}. Here is the data:\n\n${briefingContent}` },
    ];

    const result = await invokeLLM({ messages });
    const aiResponse = result.choices[0].message.content as string;

    // 5. Log the briefing
    const logEntry: InsertDailyBriefingLog = {
      userId,
      briefingDate: targetDate,
      content: aiResponse,
    };
    await addDailyBriefingLog(logEntry);

    return {
      briefing: aiResponse,
      date: targetDate.toISOString().split('T')[0],
    };
  });

// --- API Routes ---
export const aiRouter = router({
  message: chatProcedure, // /api/ai/message
  history: publicProcedure.query(async ({ ctx }) => { // /api/ai/history
    if (!ctx.user) return [];
    return getAIHistory(ctx.user.id);
  }),
  settings: getSettingsProcedure, // /api/ai/settings
  updateSettings: updateSettingsProcedure,
  dailyBriefing: dailyBriefingProcedure, // /api/ai/daily-briefing
});

// Export types for client-side usage
export type AIRouter = typeof aiRouter;
