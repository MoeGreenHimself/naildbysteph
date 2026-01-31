import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Users, DollarSign, Plus, Edit2, Trash2, Calendar, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";

// --- Space Management Component ---
const SpaceManagement = ({ spaces, refetchSpaces }: { spaces: any[], refetchSpaces: () => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newSpace, setNewSpace] = useState({ name: "", hourlyRate: 0 });
  const createSpaceMutation = trpc.rental.createSpace.useMutation();

  const handleCreateSpace = async () => {
    if (!newSpace.name || newSpace.hourlyRate <= 0) {
      toast.error("Please enter a valid name and hourly rate.");
      return;
    }
    setIsProcessing(true);
    try {
      await createSpaceMutation.mutateAsync({ ...newSpace, hourlyRate: newSpace.hourlyRate * 100 }); // Convert to cents
      toast.success(`Rental space "${newSpace.name}" created!`);
      setNewSpace({ name: "", hourlyRate: 0 });
      refetchSpaces();
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Failed to create rental space.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-pink-600" />
          Rental Spaces
        </CardTitle>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Space
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spaces.map((space) => (
              <TableRow key={space.id}>
                <TableCell className="font-medium">{space.name}</TableCell>
                <TableCell>${(space.hourlyRate / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${space.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {space.isAvailable ? 'Available' : 'Occupied'}
                  </span>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="icon" disabled><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" disabled><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Rental Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Space Name</Label>
              <Input 
                id="name" 
                value={newSpace.name} 
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input 
                id="rate" 
                type="number"
                value={newSpace.hourlyRate} 
                onChange={(e) => setNewSpace({ ...newSpace, hourlyRate: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSpace} disabled={isProcessing}>
              {isProcessing ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// --- Booking Management Component ---
const BookingManagement = ({ bookings }: { bookings: any[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-600" />
          Rental Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tech Name</TableHead>
              <TableHead>Space</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.techName}</TableCell>
                <TableCell>{booking.spaceId}</TableCell> {/* Placeholder for space name lookup */}
                <TableCell>
                  {format(new Date(booking.startTime), 'MMM d, h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                </TableCell>
                <TableCell className="font-bold">${(booking.totalCost / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    booking.status === 'paid' ? 'bg-green-100 text-green-700' : 
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Main Rental Tab Component ---
export const RentalManagementTab = () => {
  const { data: rentalSpaces = [], refetch: refetchSpaces } = trpc.rental.listSpaces.useQuery();
  const { data: rentalBookings = [], refetch: refetchBookings } = trpc.rental.listBookings.useQuery();

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-6 h-6 text-pink-600" />
        Chair/Workspace Rental Management
      </h2>
      <SpaceManagement spaces={rentalSpaces} refetchSpaces={refetchSpaces} />
      <BookingManagement bookings={rentalBookings} />
    </div>
  );
};

// --- Tech Booking Page (Simple) ---
export const TechBookingPage = () => {
  const { data: rentalSpaces = [] } = trpc.rental.listSpaces.useQuery();
  const createBookingMutation = trpc.rental.createBooking.useMutation();
  const [bookingDetails, setBookingDetails] = useState({
    spaceId: 0,
    techName: "",
    techEmail: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBooking = async () => {
    const { spaceId, techName, techEmail, date, startTime, endTime } = bookingDetails;
    if (!spaceId || !techName || !techEmail || !date || !startTime || !endTime) {
      toast.error("Please fill out all booking details.");
      return;
    }

    const space = rentalSpaces.find(s => s.id === spaceId);
    if (!space) {
      toast.error("Invalid rental space selected.");
      return;
    }

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalCost = Math.round(durationHours * space.hourlyRate);

    if (totalCost <= 0) {
      toast.error("Invalid booking time or duration.");
      return;
    }

    setIsProcessing(true);
    try {
      await createBookingMutation.mutateAsync({
        spaceId,
        techName,
        techEmail,
        startTime: start,
        endTime: end,
        totalCost,
        status: "pending",
      });
      toast.success(`Booking for ${space.name} confirmed! Total cost: $${(totalCost / 100).toFixed(2)}`);
      // Reset form or navigate
    } catch (e) {
      toast.error("Failed to create booking.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-pink-600 flex items-center gap-3 mb-6">
          <Users className="w-8 h-8" />
          Tech Workspace Booking
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Book a Chair or Station</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="techName">Your Name</Label>
                <Input id="techName" value={bookingDetails.techName} onChange={(e) => setBookingDetails({ ...bookingDetails, techName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="techEmail">Your Email</Label>
                <Input id="techEmail" type="email" value={bookingDetails.techEmail} onChange={(e) => setBookingDetails({ ...bookingDetails, techEmail: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="space">Select Space</Label>
              <select 
                id="space" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setBookingDetails({ ...bookingDetails, spaceId: Number(e.target.value) })}
              >
                <option value={0}>-- Select a Space --</option>
                {rentalSpaces.map(space => (
                  <option key={space.id} value={space.id}>
                    {space.name} (${(space.hourlyRate / 100).toFixed(2)}/hr)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={bookingDetails.date} onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" value={bookingDetails.startTime} onChange={(e) => setBookingDetails({ ...bookingDetails, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={bookingDetails.endTime} onChange={(e) => setBookingDetails({ ...bookingDetails, endTime: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleBooking} disabled={isProcessing} className="w-full">
              {isProcessing ? "Processing..." : "Book Now"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
