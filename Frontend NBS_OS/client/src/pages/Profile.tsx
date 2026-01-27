import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronLeft, Calendar, CreditCard, Award, Camera, Star, Plus, Loader2, RefreshCw, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AdBlock } from "@/components/AdComponents";

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("appointments");

  // Fetch user data
  const { data: appointments = [] } = trpc.appointments.list.useQuery();
  const { data: loyalty = { stampCount: 0 } } = trpc.loyalty.getStamps.useQuery();
  const { data: photos = [], refetch: refetchPhotos } = trpc.photos.list.useQuery();
  const { data: syncToken } = trpc.calendar.getSyncToken.useQuery();
  const regenerateTokenMutation = trpc.calendar.regenerateToken.useMutation();

  const uploadPhotoMutation = trpc.photos.upload.useMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calendarUrl = syncToken ? `${window.location.origin}/calendar/feed/${syncToken}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(calendarUrl);
    setIsCopied(true);
    toast.success("Calendar link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real Manus environment, we'd use a dedicated upload endpoint or storagePut
      // For this implementation, we'll simulate the storagePut flow
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Simulate storagePut by sending to a mock endpoint or just using the base64 for now
        // In production, this would be: const { url, key } = await storagePut(...)
        const mockUrl = base64String; 
        const mockKey = `user-photos/${user?.id}/${Date.now()}-${file.name}`;

        await uploadPhotoMutation.mutateAsync({
          imageUrl: mockUrl,
          imageKey: mockKey,
        });

        toast.success("Photo uploaded successfully!");
        refetchPhotos();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  // Filter appointments for current user
  const userAppointments = appointments.filter((apt: any) => apt.customerEmail === user?.email);
  const pastAppointments = userAppointments.filter((apt: any) => new Date(apt.appointmentDate) < new Date());
  const futureAppointments = userAppointments.filter((apt: any) => new Date(apt.appointmentDate) >= new Date());

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <p className="text-gray-700 mb-4">Please log in to view your profile.</p>
          <Link href="/">
            <Button className="bg-pink-600 hover:bg-pink-700">Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <img src={(user as any).avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name || "User"} className="w-10 h-10 rounded-full border-2 border-pink-200" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-pink-50 border-pink-100">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-pink-600" />
                <h3 className="font-bold text-gray-900">Loyalty Program</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stamps</span>
                  <span className="font-bold text-pink-600">{loyalty.stampCount}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-pink-600 h-2.5 rounded-full" style={{ width: `${(loyalty.stampCount % 10) * 10}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {10 - (loyalty.stampCount % 10)} more stamps for 40% off your next full set!
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/book">
                  <Button className="w-full bg-pink-600 hover:bg-pink-700 gap-2">
                    <Calendar className="w-4 h-4" />
                    Book New
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 border-pink-200 bg-gradient-to-br from-white to-pink-50">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-pink-500" />
                Just For You
              </h3>
              <p className="text-xs text-gray-600 mb-4">Based on your style, we recommend:</p>
              <div className="p-3 bg-white rounded-lg border border-pink-100 shadow-sm">
                <p className="text-sm font-bold text-pink-600">Deluxe Cuticle Oil</p>
                <p className="text-[10px] text-gray-500">Keep your set fresh for 3+ weeks.</p>
                <Button variant="link" className="p-0 h-auto text-xs mt-2 text-pink-700">Add to next visit →</Button>
              </div>
            </Card>

            <AdBlock placement="sidebar" />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="flex gap-4 mb-8 border-b border-gray-200">
              {[
                { id: "appointments", label: "Appointments", icon: Calendar },
                { id: "history", label: "Purchase History", icon: CreditCard },
                { id: "photos", label: "My Nail Sets", icon: Camera },
                { id: "sync", label: "Calendar Sync", icon: RefreshCw },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-semibold transition flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "text-pink-600 border-b-2 border-pink-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "appointments" && (
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Appointments</h3>
                  {futureAppointments.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <p className="text-gray-500">No upcoming appointments</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {futureAppointments.map((apt: any) => (
                        <Card key={apt.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-gray-600">{apt.appointmentTime}</p>
                            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${
                              apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {apt.status.toUpperCase()}
                            </span>
                          </div>
                          <Button variant="outline" size="sm">Reschedule</Button>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Past Appointments</h3>
                  <div className="grid gap-4">
                    {pastAppointments.map((apt: any) => (
                      <Card key={apt.id} className="p-4 flex items-center justify-between opacity-75">
                        <div>
                          <p className="font-bold text-gray-900">{new Date(apt.appointmentDate).toLocaleDateString()}</p>
                          <p className="text-gray-600">{apt.appointmentTime}</p>
                        </div>
                        <span className="text-gray-400 text-sm">Completed</span>
                      </Card>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "history" && (
              <Card className="p-8 text-center border-dashed">
                <p className="text-gray-500">No purchase history found</p>
              </Card>
            )}

            {activeTab === "photos" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo: any) => (
                  <Card key={photo.id} className="aspect-square overflow-hidden relative group">
                    <img src={photo.imageUrl} alt="Nail Set" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-bold">{new Date(photo.createdAt).toLocaleDateString()}</p>
                    </div>
                  </Card>
                ))}
                <Card 
                  className="aspect-square flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">Upload Photo</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </Card>
              </div>
            )}

            {activeTab === "sync" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Sync with Your Calendar</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Copy this link to subscribe to your appointments in Apple Calendar, Google Calendar, or Outlook.
                  </p>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-100 p-3 rounded-md font-mono text-xs break-all border border-gray-200">
                      {calendarUrl || "Generating link..."}
                    </div>
                    <Button variant="outline" onClick={copyToClipboard} className="shrink-0">
                      {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm">iPhone / Apple Calendar</h4>
                      <ol className="text-xs text-gray-500 list-decimal pl-4 space-y-1">
                        <li>Open Settings on your iPhone</li>
                        <li>Tap Calendar &gt; Accounts &gt; Add Account</li>
                        <li>Select "Other" &gt; "Add Subscribed Calendar"</li>
                        <li>Paste the link above and tap Next</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm">Google Calendar</h4>
                      <ol className="text-xs text-gray-500 list-decimal pl-4 space-y-1">
                        <li>Open Google Calendar on your computer</li>
                        <li>Next to "Other calendars," click + &gt; From URL</li>
                        <li>Paste the link above</li>
                        <li>Click "Add calendar"</li>
                      </ol>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => {
                      if(confirm("Regenerating will break your existing calendar sync. Continue?")) {
                        regenerateTokenMutation.mutate();
                        toast.success("Sync token regenerated");
                      }
                    }}
                  >
                    Regenerate Sync Token
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
