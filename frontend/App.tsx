import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/ComponentShowcase";
import NailSimulator from "./pages/NailSimulator";
import TechBooking from "./pages/TechBooking";
import BookAppointment from "./pages/BookAppointment";
import Calendar from "./pages/Calendar";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import { AdPopup } from "./components/AdComponents";
import { AIChatPanel } from "./components/AIChatPanel";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { Button } from "./components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

function Router() {
  const { deferredPrompt, isAppInstalled, promptInstall } = usePWAInstall();

  useEffect(() => {
    if (deferredPrompt && !isAppInstalled) {
      toast.info(
        <div className="flex items-center justify-between w-full">
          <span>Install NaildBySteph as an app!</span>
          <Button 
            onClick={promptInstall} 
            size="sm" 
            className="ml-4 bg-pink-600 hover:bg-pink-700"
          >
            <Download className="w-4 h-4 mr-2" /> Install
          </Button>
        </div>,
        {
          duration: 10000,
          id: 'pwa-install-prompt',
        }
      );
    }
  }, [deferredPrompt, isAppInstalled, promptInstall]);
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={BookAppointment} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={Admin} />
      <Route path="/profile" component={Profile} />
      <Route path="/simulator" component={NailSimulator} />
      <Route path="/tech-booking" component={TechBooking} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <AdPopup />
          <AIChatPanel />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
