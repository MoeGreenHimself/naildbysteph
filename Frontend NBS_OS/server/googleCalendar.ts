import { google } from "googleapis";
import { ENV } from "./_core/env";

/**
 * Note: This is a placeholder for Google Calendar API integration.
 * In a real production environment, you would need:
 * 1. A Google Cloud Project with Calendar API enabled.
 * 2. OAuth2 credentials (client ID, client secret).
 * 3. User consent flow to get refresh tokens.
 * 
 * For this project, we provide the structure to connect these.
 */

export async function createGoogleCalendarEvent(appointment: any) {
  // If no credentials are set, we skip (silent fail or log)
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

    // In a real app, you'd fetch the user's refresh token from the DB
    // oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

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
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "America/Los_Angeles",
      },
    };

    // await calendar.events.insert({
    //   calendarId: "primary",
    //   requestBody: event,
    // });
    
    console.log("[Google Calendar] Event would be created for:", appointment.customerName);
  } catch (error) {
    console.error("[Google Calendar] Error creating event:", error);
  }
}
