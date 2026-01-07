import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronLeft, Calendar } from "lucide-react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Calendar</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar Widget */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => day && setSelectedDate(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
                  className={`p-2 rounded text-sm transition ${
                    day === null
                      ? "text-gray-300"
                      : selectedDate === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      ? "bg-pink-600 text-white font-semibold"
                      : "hover:bg-pink-100 text-gray-900"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {selectedDate && (
              <div className="mt-6 p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">Selected Date:</p>
                <p className="text-lg font-semibold text-pink-600">{selectedDate}</p>
              </div>
            )}
          </Card>

          {/* Apple Calendar Integration */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Apple Calendar Integration</h2>
            <p className="text-gray-700 mb-6">
              Sync your appointments with your Apple Calendar on iPhone, iPad, or Mac.
            </p>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">iPhone & iPad</h3>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Open the Calendar app</li>
                  <li>Tap "Calendars" at the bottom</li>
                  <li>Tap "Add Calendar"</li>
                  <li>Select "Subscribe to Calendar"</li>
                  <li>Enter the calendar URL</li>
                </ol>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Mac</h3>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Open Calendar app</li>
                  <li>Go to File &gt; New Calendar Subscription</li>
                  <li>Enter the calendar URL</li>
                  <li>Click "Subscribe"</li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Calendar URL:</strong> You will receive this via email after booking your appointment.
              </p>
            </div>

            <Link href="/book">
              <Button className="w-full bg-pink-600 hover:bg-pink-700">
                Book an Appointment
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
