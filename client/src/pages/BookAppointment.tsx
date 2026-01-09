import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ChevronLeft, Loader2, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BookAppointment() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVip, setIsVip] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    appointmentDate: "",
    appointmentTime: "",
    paymentMethod: "",
    serviceId: "",
    isRecurring: false,
    recurringPattern: "weekly", // weekly, biweekly, monthly
  });

  // Fetch data
  const { data: services = [] } = trpc.services.list.useQuery();
  const { data: availabilitySlots = [] } = trpc.availability.list.useQuery();
  const { data: blockedDates = [] } = trpc.admin.getBlockedDates.useQuery();
  const { data: vipList = [] } = trpc.admin.getVipWhitelist.useQuery();

  useEffect(() => {
    if (user?.email && vipList.some((v: any) => v.email === user.email)) {
      setIsVip(true);
    }
  }, [user, vipList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.serviceId) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    if (step === 2) {
      if (!formData.appointmentDate || !formData.appointmentTime) {
        toast.error("Please select a date and time");
        return;
      }
      // Check if date is blocked (unless VIP)
      const selectedDate = new Date(formData.appointmentDate).toISOString().split('T')[0];
      const isBlocked = blockedDates.some((d: any) => new Date(d.date).toISOString().split('T')[0] === selectedDate);
      if (isBlocked && !isVip) {
        toast.error("This date is currently blocked. Please select another date.");
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const createAppointmentMutation = trpc.appointments.create.useMutation();
  const createPaymentMutation = trpc.payments.create.useMutation();

  const handleSubmit = async () => {
    if (!formData.paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedService = services.find((s: any) => s.id === parseInt(formData.serviceId));
      const depositAmount = 2500; // Default $25

      const appointment = await createAppointmentMutation.mutateAsync({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        appointmentDate: new Date(formData.appointmentDate),
        appointmentTime: formData.appointmentTime,
        status: "pending",
        depositPaid: 0,
        depositAmount: depositAmount,
        paymentMethod: formData.paymentMethod,
        notes: formData.isRecurring ? `RECURRING: ${formData.recurringPattern.toUpperCase()}` : "",
      });

      await createPaymentMutation.mutateAsync({
        appointmentId: (appointment as any).insertId || 1,
        amount: depositAmount,
        paymentMethod: formData.paymentMethod as any,
        status: "pending",
      });

      toast.success("Booking request sent! Please complete your deposit to finalize.");
      setTimeout(() => window.location.href = "/profile", 2000);
    } catch (error) {
      toast.error("Failed to book appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-2" />Back</Button>
            </Link>
            <h1 className="text-xl font-bold">Book Appointment</h1>
          </div>
          {isVip && (
            <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
              <Star className="w-3 h-3 fill-current" /> VIP STATUS
            </div>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8 flex justify-between items-center">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${num <= step ? "bg-pink-600 text-white" : "bg-gray-200 text-gray-500"}`}>{num}</div>
              {num < 3 && <div className={`flex-1 h-1 mx-2 ${num < step ? "bg-pink-600" : "bg-gray-200"}`}></div>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Service & Info</h2>
            <div className="space-y-4">
              <div>
                <Label>Select Service</Label>
                <select 
                  name="serviceId" 
                  value={formData.serviceId} 
                  onChange={handleInputChange}
                  className="w-full mt-2 p-2 border rounded-md"
                >
                  <option value="">Choose a service...</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} - ${s.price/100}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input name="customerName" value={formData.customerName} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input name="customerEmail" type="email" value={formData.customerEmail} onChange={handleInputChange} />
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="recurring" name="isRecurring" checked={formData.isRecurring} onChange={handleInputChange} />
                  <Label htmlFor="recurring" className="cursor-pointer">Request as recurring appointment</Label>
                </div>
                {formData.isRecurring && (
                  <div className="pl-6">
                    <Label className="text-xs text-gray-500">Frequency</Label>
                    <select 
                      name="recurringPattern" 
                      value={formData.recurringPattern} 
                      onChange={handleInputChange}
                      className="w-full mt-1 p-2 border rounded-md text-sm"
                    >
                      <option value="weekly">Every Week</option>
                      <option value="biweekly">Every 2 Weeks</option>
                      <option value="monthly">Every Month</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <Button onClick={handleNext} className="bg-pink-600 hover:bg-pink-700">Next Step</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Date & Time</h2>
            <div className="space-y-6">
              <div>
                <Label>Date</Label>
                <Input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleInputChange} className="mt-2" />
              </div>
              <div>
                <Label>Available Times</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["09:00", "11:00", "13:00", "15:00", "17:00"].map(time => (
                    <button 
                      key={time} 
                      onClick={() => setFormData(p => ({...p, appointmentTime: time}))}
                      className={`p-3 rounded border-2 text-sm font-medium ${formData.appointmentTime === time ? "border-pink-600 bg-pink-50 text-pink-700" : "border-gray-200 hover:border-pink-400"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext} className="bg-pink-600 hover:bg-pink-700">Next Step</Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Confirm & Deposit</h2>
            <div className="bg-pink-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Service</span>
                <span className="font-bold">{services.find((s: any) => s.id === parseInt(formData.serviceId))?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Date & Time</span>
                <span className="font-bold">{formData.appointmentDate} at {formData.appointmentTime}</span>
              </div>
              <div className="border-t border-pink-200 my-2 pt-2 flex justify-between">
                <span className="font-bold">Required Deposit</span>
                <span className="font-bold text-pink-600">$25.00</span>
              </div>
            </div>
            
            <Label className="mb-3 block">Select Payment Handle</Label>
            <div className="space-y-2 mb-8">
              {["Cash App", "Venmo", "PayPal"].map(method => (
                <button 
                  key={method}
                  onClick={() => setFormData(p => ({...p, paymentMethod: method.toLowerCase().replace(' ', '_')}))}
                  className={`w-full p-4 rounded border-2 text-left flex justify-between items-center ${formData.paymentMethod === method.toLowerCase().replace(' ', '_') ? "border-pink-600 bg-pink-50" : "border-gray-200"}`}
                >
                  <span className="font-bold">{method}</span>
                  <span className="text-xs text-gray-500">Pay to: $naildbysteph</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700">
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Request Appointment
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
