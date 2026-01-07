import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ChevronLeft, Plus, Edit2, Trash2, Settings, Users, Package, Calendar, Mail, ShieldCheck, BarChart3, Megaphone, DollarSign, FileText, History, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sparkles, Home } from "lucide-react";
import { RentalManagementTab } from "@/components/RentalManagementTab";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("appointments");

  // Queries
  const { data: appointments = [], refetch: refetchApts } = trpc.appointments.list.useQuery();
  const { data: services = [], refetch: refetchServices } = trpc.services.list.useQuery();
  const { data: inventory = [], refetch: refetchInventory } = trpc.inventory.list.useQuery();
  const updateInventoryMutation = trpc.inventory.update.useMutation();
  const { data: ads = [], refetch: refetchAds } = trpc.ads.listAll.useQuery();
  const { data: performance = [] } = trpc.ads.performance.useQuery();
  const { data: depositLogs = [], refetch: refetchDeposits } = trpc.admin.getDepositLogs.useQuery();
  const { data: financials = {} } = trpc.admin.getFinancials.useQuery() as any;
  const { data: vipList = [], refetch: refetchVip } = trpc.admin.getVipWhitelist.useQuery();
  const { data: blockedDates = [], refetch: refetchBlocked } = trpc.admin.getBlockedDates.useQuery();
  const { data: aiSettings, refetch: refetchAISettings } = trpc.ai.settings.useQuery();
  const { data: rentalSpaces = [], refetch: refetchSpaces } = trpc.rental.listSpaces.useQuery();
  const { data: rentalBookings = [], refetch: refetchBookings } = trpc.rental.listBookings.useQuery();

  // Mutations
  const updateAptMutation = trpc.appointments.update.useMutation();
  const createAdMutation = trpc.ads.create.useMutation();
  const updateAdMutation = trpc.ads.update.useMutation();
  const verifyDepositMutation = trpc.admin.verifyDeposit.useMutation();
  const triggerAutoVerifyMutation = trpc.admin.triggerAutoVerify.useMutation();
  const createServiceMutation = trpc.services.create.useMutation();
  const addVipMutation = trpc.admin.addToVipWhitelist.useMutation();
  const updateVipScoresMutation = trpc.admin.updateVipScores.useMutation();
  const addBlockedMutation = trpc.admin.addBlockedDate.useMutation();

  const [newVipEmail, setNewVipEmail] = useState("");
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const [newThreshold, setNewThreshold] = useState(0);
  const updateAISettingsMutation = trpc.ai.updateSettings.useMutation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [finSettings, setFinSettings] = useState({
    hourlyLaborCost: 0,
    rentPerAppointment: 0,
    marketingSpendMonthly: 0,
    vipSilverThreshold: 100,
    vipGoldThreshold: 500,
    vipVipThreshold: 1000,
  });

  useEffect(() => {
    if (financials && Object.keys(financials).length > 0) {
      const f = financials as any;
      setFinSettings({
        hourlyLaborCost: f.hourlyLaborCost || 0,
        rentPerAppointment: f.rentPerAppointment || 0,
        marketingSpendMonthly: f.marketingSpendMonthly || 0,
        vipSilverThreshold: f.vipSilverThreshold || 100,
        vipGoldThreshold: f.vipGoldThreshold || 500,
        vipVipThreshold: f.vipVipThreshold || 1000,
      });
    }
  }, [financials]);

  const updateFinMutation = trpc.admin.updateFinancials.useMutation();

  const [newAd, setNewAd] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    adType: "block" as "block" | "popup",
    placement: "sidebar",
  });

  const handleStatusUpdate = async (id: number, status: string) => {
    setIsProcessing(true);
    try {
      await updateAptMutation.mutateAsync({ id, status });
      toast.success(`Appointment ${status}`);
      refetchApts();
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddVip = async () => {
    if (!newVipEmail || !newVipEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setIsProcessing(true);
    try {
      await addVipMutation.mutateAsync({ email: newVipEmail, notes: "Added via admin" });
      setNewVipEmail("");
      toast.success("Added to VIP whitelist");
      refetchVip();
    } catch (e) {
      toast.error("Failed to add VIP");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddBlocked = async () => {
    if (!newBlockedDate) {
      toast.error("Please select a date");
      return;
    }
    setIsProcessing(true);
    try {
      await addBlockedMutation.mutateAsync({ date: newBlockedDate, reason: "Blocked by admin" });
      setNewBlockedDate("");
      toast.success("Date blocked");
      refetchBlocked();
    } catch (e) {
      toast.error("Failed to block date");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename}`);
  };

  const handleAddAd = async () => {
    if (!newAd.title || !newAd.linkUrl) {
      toast.error("Title and Link URL are required");
      return;
    }
    setIsProcessing(true);
    try {
      await createAdMutation.mutateAsync(newAd);
      setNewAd({
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
        adType: "block",
        placement: "sidebar",
      });
      toast.success("Advertisement created");
      refetchAds();
    } catch (e) {
      toast.error("Failed to create ad");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAdStatus = async (id: number, currentStatus: number) => {
    setIsProcessing(true);
    try {
      await updateAdMutation.mutateAsync({ id, isActive: currentStatus === 1 ? 0 : 1 });
      toast.success("Ad status updated");
      refetchAds();
    } catch (e) {
      toast.error("Failed to update ad");
    } finally {
      setIsProcessing(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <p className="text-gray-700 mb-4">Unauthorized Access</p>
          <Link href="/"><Button className="bg-pink-600">Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-pink-600">NaildBy_Steph</h1>
          <p className="text-xs text-gray-500">Admin Control Panel</p>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { id: "appointments", label: "Appointments", icon: Calendar },
            { id: "services", label: "Services & Pricing", icon: ShieldCheck },
            { id: "inventory", label: "Inventory", icon: Package },
            { id: "rental", label: "Chair Rental", icon: Users },
            { id: "marketing", label: "Marketing", icon: Mail },
            { id: "ads", label: "Ads & Affiliates", icon: Megaphone },
            { id: "deposits", label: "Deposits", icon: DollarSign },
            { id: "analytics", label: "P&L Analytics", icon: BarChart3 },
            { id: "ai", label: "Salon AI", icon: Sparkles },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === item.id ? "bg-pink-50 text-pink-600" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900 capitalize">{activeTab}</h2>
          <Link href="/"><Button variant="outline" size="sm">View Site</Button></Link>
        </header>

        <div className="p-8">
          {activeTab === "appointments" && (
            <Card className="overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Date/Time</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((apt: any) => (
                    <tr key={apt.id}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{apt.customerName}</div>
                        <div className="text-xs text-gray-500">{apt.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{apt.status}</span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {apt.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(apt.id, 'confirmed')} disabled={isProcessing}>Confirm</Button>
                        )}
                        {apt.status === 'confirmed' && (
                          <Button size="sm" variant="outline" className="bg-green-50" onClick={() => handleStatusUpdate(apt.id, 'completed')} disabled={isProcessing}>Complete</Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleStatusUpdate(apt.id, 'cancelled')} disabled={isProcessing}>Cancel</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Manage Services</h3>
                <Button className="bg-pink-600"><Plus className="w-4 h-4 mr-2" />Add Service</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s: any) => (
                  <Card key={s.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-sm text-gray-500">${s.price/100} • {s.duration} mins</p>
                    </div>
                    <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "vip" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-bold mb-4">VIP Whitelist</h3>
                <div className="flex gap-2 mb-4">
                  <Input placeholder="Email address" value={newVipEmail} onChange={(e) => setNewVipEmail(e.target.value)} />
                  <Button onClick={handleAddVip} className="bg-pink-600">Add</Button>
                </div>
                <div className="space-y-2">
                  {vipList.map((v: any) => (
                    <div key={v.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{v.email}</span>
                      <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Blocked Dates</h3>
                <div className="flex gap-2 mb-4">
                  <Input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} />
                  <Button onClick={handleAddBlocked} className="bg-pink-600">Block</Button>
                </div>
                <div className="space-y-2">
                  {blockedDates.map((d: any) => (
                    <div key={d.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{new Date(d.date).toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "inventory" && (
            <Card className="p-6">
              <h3 className="font-bold mb-6">Product Inventory</h3>
              <div className="space-y-4">
                {inventory.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-bold">{item.itemName}</p>
                      <p className="text-xs text-gray-500">Threshold: {item.restockThreshold} {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${item.quantity <= item.restockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        {item.quantity} {item.unit}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>Update</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "ai" && (
            <AISettingsTab />
          )}

          {activeTab === "rental" && (
            <RentalManagementTab />
          )}

          {activeTab === "analytics" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">P&L Analytics</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(appointments, "revenue_report")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export Revenue
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(inventory, "inventory_usage")}>
                    <Package className="w-4 h-4 mr-2" />
                    Export Inventory
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: `$${appointments.filter((a: any) => a.status === 'completed').reduce((sum, a: any) => sum + (a.price || 0), 0)}`, icon: DollarSign, color: "text-green-600" },
                  { label: "Net Profit", value: `$${Math.floor(appointments.filter((a: any) => a.status === 'completed').reduce((sum, a: any) => sum + (a.price || 0), 0) * 0.65)}`, icon: BarChart3, color: "text-pink-600" },
                  { label: "Avg Margin", value: "65%", icon: ShieldCheck, color: "text-blue-600" },
                  { label: "Inventory Burn", value: "Low", icon: Package, color: "text-orange-600" },
                ].map((stat, i) => (
                  <Card key={i} className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="font-bold mb-6 flex items-center gap-2">
                    <History className="w-4 h-4 text-pink-600" />
                    Revenue vs Cost Trends
                  </h3>
                  <div className="h-64 flex items-end gap-4 px-4">
                    {[30, 45, 35, 60, 55, 80, 75, 90, 85, 100, 95, 110].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-1">
                        <div className="w-full bg-pink-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        <div className="w-full bg-gray-200 rounded-t-sm" style={{ height: `${h * 0.4}%` }}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 px-2 text-[10px] text-gray-400 uppercase font-bold">
                    <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold mb-6 flex items-center gap-2">
                    <Package className="w-4 h-4 text-pink-600" />
                    Cost Breakdown
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: "Product Supplies", value: 15, color: "bg-pink-500" },
                      { label: "Labor Cost", value: 40, color: "bg-blue-500" },
                      { label: "Rent & Utilities", value: 25, color: "bg-orange-500" },
                      { label: "Marketing", value: 10, color: "bg-green-500" },
                      { label: "Other", value: 10, color: "bg-gray-400" },
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{item.label}</span>
                          <span>{item.value}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Profitability by Service</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Revenue</th>
                        <th className="px-4 py-3">Supply Cost</th>
                        <th className="px-4 py-3">Time Cost</th>
                        <th className="px-4 py-3">Net Profit</th>
                        <th className="px-4 py-3">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {services.map((s: any) => {
                        const rev = s.price;
                        const cost = (s.productCost || 0) + (financials.hourlyLaborCost || 0) * (s.duration / 60);
                        const profit = rev - cost;
                        const margin = rev > 0 ? Math.floor((profit / rev) * 100) : 0;
                        return (
                          <tr key={s.id}>
                            <td className="px-4 py-3 font-medium">{s.name}</td>
                            <td className="px-4 py-3">${rev}</td>
                            <td className="px-4 py-3 text-red-500">-${s.productCost || 0}</td>
                            <td className="px-4 py-3 text-red-500">-${Math.floor((financials.hourlyLaborCost || 0) * (s.duration / 60))}</td>
                            <td className="px-4 py-3 font-bold text-green-600">${Math.floor(profit)}</td>
                            <td className="px-4 py-3">
                              <span className={`font-bold ${margin > 50 ? 'text-green-600' : 'text-orange-600'}`}>
                                {margin}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 p-6">
                  <h3 className="font-bold mb-4">Create New Ad</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={newAd.title} onChange={(e) => setNewAd({...newAd, title: e.target.value})} placeholder="Vendor Name / Product" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={newAd.description} onChange={(e) => setNewAd({...newAd, description: e.target.value})} placeholder="Short ad copy..." />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input value={newAd.imageUrl} onChange={(e) => setNewAd({...newAd, imageUrl: e.target.value})} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>Link URL</Label>
                      <Input value={newAd.linkUrl} onChange={(e) => setNewAd({...newAd, linkUrl: e.target.value})} placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <select 
                          className="w-full p-2 border rounded-md text-sm"
                          value={newAd.adType}
                          onChange={(e) => setNewAd({...newAd, adType: e.target.value as any})}
                        >
                          <option value="block">Block</option>
                          <option value="popup">Popup</option>
                        </select>
                      </div>
                      <div>
                        <Label>Placement</Label>
                        <select 
                          className="w-full p-2 border rounded-md text-sm"
                          value={newAd.placement}
                          onChange={(e) => setNewAd({...newAd, placement: e.target.value})}
                        >
                          <option value="sidebar">Sidebar</option>
                          <option value="footer">Footer</option>
                          <option value="booking_page">Booking Page</option>
                        </select>
                      </div>
                    </div>
                    <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={handleAddAd} disabled={isProcessing}>
                      Create Advertisement
                    </Button>
                  </div>
                </Card>

                <div className="lg:col-span-2 space-y-8">
                  <Card className="p-6">
                    <h3 className="font-bold mb-4">Active Advertisements</h3>
                    <div className="space-y-4">
                      {ads.map((ad: any) => {
                        const perf = performance as any[];
                        const adPerf = perf.filter((p: any) => p.adId === ad.id);
                        const impressions = adPerf.filter((p: any) => p.eventType === 'impression').length;
                        const clicks = adPerf.filter((p: any) => p.eventType === 'click').length;
                        const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : 0;

                        return (
                          <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                {ad.imageUrl ? <img src={ad.imageUrl} className="w-full h-full object-cover" /> : <Megaphone className="w-6 h-6 m-3 text-gray-300" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{ad.title}</p>
                                <p className="text-xs text-gray-500">{ad.adType.toUpperCase()} • {ad.placement}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400 uppercase">CTR</p>
                                <p className="font-bold text-pink-600">{ctr}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400 uppercase">Clicks</p>
                                <p className="font-bold">{clicks}</p>
                              </div>
                              <Button 
                                variant={ad.isActive ? "outline" : "secondary"} 
                                size="sm"
                                onClick={() => toggleAdStatus(ad.id, ad.isActive)}
                              >
                                {ad.isActive ? "Active" : "Paused"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-pink-600" />
                      Performance Analytics
                    </h3>
                    <div className="h-48 flex items-end gap-2 px-4">
                      {/* Mock chart bars */}
                      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-pink-100 rounded-t-sm relative group" style={{ height: `${h}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {h * 12} clicks
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 px-4 text-[10px] text-gray-400">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deposits" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Deposit Verification</h2>
                <Button 
                  className="bg-pink-600 hover:bg-pink-700"
                  onClick={async () => {
                    await triggerAutoVerifyMutation.mutateAsync({});
                    toast.success("Auto-verification complete");
                    refetchDeposits();
                    refetchApts();
                  }}
                >
                  <History className="w-4 h-4 mr-2" />
                  Run Auto-Verify
                </Button>
              </div>

              <Card className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Platform</th>
                        <th className="px-4 py-3">Handle</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {depositLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium">{log.platform}</td>
                          <td className="px-4 py-3">{log.handle}</td>
                          <td className="px-4 py-3 font-bold text-green-600">${log.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              log.status === 'matched' ? 'bg-green-100 text-green-700' :
                              log.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {log.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-[10px] border-green-200 text-green-600 hover:bg-green-50"
                                  onClick={async () => {
                                    const aptId = prompt("Enter Appointment ID to match:");
                                    if (aptId) {
                                      await verifyDepositMutation.mutateAsync({ id: log.id, status: 'matched', appointmentId: parseInt(aptId) });
                                      toast.success("Manually matched");
                                      refetchDeposits();
                                    }
                                  }}
                                >
                                  Match
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-[10px] border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={async () => {
                                    await verifyDepositMutation.mutateAsync({ id: log.id, status: 'failed' });
                                    toast.success("Marked as failed");
                                    refetchDeposits();
                                  }}
                                >
                                  Fail
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-8">
              <Card className="p-6">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-pink-600" />
                  Financial & VIP Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Hourly Labor Cost ($)</Label>
                    <Input type="number" value={finSettings.hourlyLaborCost} onChange={(e) => setFinSettings({...finSettings, hourlyLaborCost: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rent per Appointment ($)</Label>
                    <Input type="number" value={finSettings.rentPerAppointment} onChange={(e) => setFinSettings({...finSettings, rentPerAppointment: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Marketing Spend ($)</Label>
                    <Input type="number" value={finSettings.marketingSpendMonthly} onChange={(e) => setFinSettings({...finSettings, marketingSpendMonthly: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Silver VIP Threshold (Score)</Label>
                    <Input type="number" value={finSettings.vipSilverThreshold} onChange={(e) => setFinSettings({...finSettings, vipSilverThreshold: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gold VIP Threshold (Score)</Label>
                    <Input type="number" value={finSettings.vipGoldThreshold} onChange={(e) => setFinSettings({...finSettings, vipGoldThreshold: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>VIP Tier Threshold (Score)</Label>
                    <Input type="number" value={finSettings.vipVipThreshold} onChange={(e) => setFinSettings({...finSettings, vipVipThreshold: parseInt(e.target.value)})} />
                  </div>
                </div>
                <Button 
                  className="mt-6 bg-pink-600 hover:bg-pink-700"
                  onClick={async () => {
                    await updateFinMutation.mutateAsync(finSettings);
                    toast.success("Financial settings saved");
                  }}
                >
                  Save Financial Settings
                </Button>
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">VIP Tier Management</h3>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      await updateVipScoresMutation.mutateAsync({});
                      toast.success("VIP tiers updated");
                      refetchVip();
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update VIP Tiers
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Email Campaigns</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Birthday Recognition", desc: "Auto-send 15% off code", template: "Happy Birthday! Enjoy 15% off your next set." },
                    { title: "Holiday Special", desc: "Christmas & New Year templates", template: "Happy Holidays! Book your festive set now." },
                    { title: "Frequent Visitor", desc: "Bonus stamp for 3+ visits/mo", template: "Thanks for being a regular! Here's a bonus stamp." },
                  ].map((camp, i) => (
                    <div key={i} className="p-4 border rounded-lg hover:border-pink-300 transition cursor-pointer group">
                      <p className="font-bold text-sm">{camp.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{camp.desc}</p>
                      <div className="mt-3 p-2 bg-gray-50 rounded text-[10px] text-gray-400 italic hidden group-hover:block">
                        Template: "{camp.template}"
                      </div>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs mt-3 text-pink-600"
                        onClick={() => toast.info(`Configuring ${camp.title}...`)}
                      >
                        Configure →
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Customer List</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gray-50 rounded text-sm font-bold">
                    <span>Email</span>
                    <span>Total Visits</span>
                  </div>
                  {appointments.slice(0, 5).map((apt: any, i: number) => (
                    <div key={i} className="flex justify-between p-3 border-b text-sm">
                      <span>{apt.customerEmail}</span>
                      <span className="text-pink-600 font-bold">1</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- AI Settings Tab Component ---
const AISettingsTab = () => {
  const { data: aiSettings, refetch: refetchAISettings } = trpc.ai.settings.useQuery();
  const updateAISettingsMutation = trpc.ai.updateSettings.useMutation();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    tone: "",
    briefingStyle: "short",
    reminderTiming: "end_of_day",
    messageLength: "short",
    detailLevel: "simple",
  });

  useEffect(() => {
    if (aiSettings) {
      setSettings({
        tone: aiSettings.tone || "",
        briefingStyle: aiSettings.briefingStyle || "short",
        reminderTiming: aiSettings.reminderTiming || "end_of_day",
        messageLength: aiSettings.messageLength || "short",
        detailLevel: aiSettings.detailLevel || "simple",
      });
    }
  }, [aiSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAISettingsMutation.mutateAsync(settings);
      toast.success("Salon AI settings updated!");
      refetchAISettings();
    } catch (e) {
      toast.error("Failed to save AI settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const OptionGroup = ({ label, value, options, onChange }: { label: string, value: string, options: { label: string, value: string }[], onChange: (value: string) => void }) => (
    <div className="space-y-2">
      <Label className="font-semibold">{label}</Label>
      <div className="flex space-x-4">
        {options.map(option => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            onClick={() => onChange(option.value)}
            disabled={isSaving}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-pink-600" />
          Salon AI Personality Settings
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure the personality and workflow preferences for your "older homegirl from Sanger" AI assistant.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tone" className="font-semibold">Tone (Older Homegirl from Sanger)</Label>
            <Input
              id="tone"
              value={settings.tone}
              onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
              placeholder="e.g., warm, calm, supportive"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500">This sets the base personality. The default is already set in the backend.</p>
          </div>

          <OptionGroup
            label="Daily Briefing Style"
            value={settings.briefingStyle}
            options={[
              { label: "Short (Steph's Preference)", value: "short" },
              { label: "Long", value: "long" },
            ]}
            onChange={(value) => setSettings({ ...settings, briefingStyle: value })}
          />

          <OptionGroup
            label="Reminder Timing"
            value={settings.reminderTiming}
            options={[
              { label: "Early Morning", value: "early_morning" },
              { label: "Mid-Day", value: "mid_day" },
              { label: "End of Day (Steph's Preference)", value: "end_of_day" },
            ]}
            onChange={(value) => setSettings({ ...settings, reminderTiming: value })}
          />

          <OptionGroup
            label="Message Length"
            value={settings.messageLength}
            options={[
              { label: "Short (Steph's Preference)", value: "short" },
              { label: "Long", value: "long" },
            ]}
            onChange={(value) => setSettings({ ...settings, messageLength: value })}
          />

          <OptionGroup
            label="Detail Level"
            value={settings.detailLevel}
            options={[
              { label: "Simple (Steph's Preference)", value: "simple" },
              { label: "Detailed", value: "detailed" },
            ]}
            onChange={(value) => setSettings({ ...settings, detailLevel: value })}
          />

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save AI Settings"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <History className="size-5 text-pink-600" />
          Daily Briefing Logs
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Logs of the daily briefings generated by the Salon AI. (Implementation for this section is in Phase 4)
        </p>
        <Button variant="outline" disabled>
          View Logs (Coming Soon)
        </Button>
      </Card>
    </div>
  );
};

// End of AISettingsTab component


  const handleUpdateInventory = async () => {
    if (!editingItem) return;
    setIsProcessing(true);
    try {
      await updateInventoryMutation.mutateAsync({ 
        id: editingItem.id, 
        quantity: newQuantity,
        restockThreshold: newThreshold,
      });
      toast.success(`${editingItem.itemName} updated successfully!`);
      refetchInventory();
      setEditingItem(null);
    } catch (e) {
      toast.error("Failed to update inventory item.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setNewQuantity(item.quantity);
    setNewThreshold(item.restockThreshold);
  };


  {/* Inventory Edit Modal */}
  {editingItem && (
    <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update {editingItem.itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Current Quantity</Label>
            <Input 
              id="quantity" 
              type="number"
              value={newQuantity} 
              onChange={(e) => setNewQuantity(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="threshold">Restock Threshold</Label>
            <Input 
              id="threshold" 
              type="number"
              value={newThreshold} 
              onChange={(e) => setNewThreshold(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
          <Button onClick={handleUpdateInventory} disabled={isProcessing}>
            {isProcessing ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )}
