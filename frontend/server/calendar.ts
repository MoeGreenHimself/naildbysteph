import { Router } from "express";
import ical from "ical-generator";
import { getUserBySyncToken, getAppointments } from "./db";

const calendarRouter = Router();

calendarRouter.get("/feed/:token", async (req, res) => {
  const { token } = req.params;
  const user = await getUserBySyncToken(token);

  if (!user) {
    return res.status(404).send("Invalid sync token");
  }

  const appointments = await getAppointments();
  // Filter for this user's appointments (if user) or all (if admin)
  const userAppointments = user.role === "admin" 
    ? appointments 
    : appointments.filter(apt => apt.customerEmail === user.email);

  const calendar = ical({ name: "Nail'd by Steph Appointments" });

  userAppointments.forEach(apt => {
    const start = new Date(apt.appointmentDate);
    // Parse time HH:MM
    const [hours, minutes] = apt.appointmentTime.split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start);
    end.setHours(start.getHours() + 1); // Default 1 hour

    calendar.createEvent({
      start,
      end,
      summary: `Nail Appointment: ${apt.customerName}`,
      description: `Service: ${apt.notes || "Nail Service"}\nStatus: ${apt.status}`,
      location: "Nail'd by Steph Studio",
      url: "https://naildbysteph.beauty",
    });
  });

  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="appointments.ics"');
  res.send(calendar.toString());
});

export default calendarRouter;
