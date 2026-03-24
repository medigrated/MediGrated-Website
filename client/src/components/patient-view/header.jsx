import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlignJustify, LogOut, Bell, Search, 
  LayoutDashboard, MessageSquare, Users, FileText, User 
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/store/authSlice/authSlice";
import { setSearchQuery } from "@/store/searchSlice";
import { toast } from "sonner";
import { ThemeToggle } from "../ui/theme-toggle";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

function PatientHeader({ setOpenSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, user } = useSelector((state) => state.auth);
  const { globalSearchQuery } = useSelector((state) => state.search);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const alertsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(event.target)) {
        setIsAlertsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch family alerts
  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/family/alerts", { withCredentials: true });
        if (res.data.success) {
          setAlerts(res.data.alerts);
          // Simplified unread logic: any missed/skipped today is "unread" if we want, or just count total
          setUnreadCount(res.data.alerts.length);
        }
      } catch (e) {
        console.error("Failed to fetch alerts", e);
      }
    };
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Logged out successfully!");
      navigate("/auth/login");
    } catch (error) {
      toast.error(error?.message || "Failed to log out. Please try again.");
      console.error("Logout failed:", error);
    }
  };

  // Quick navigation links for the dropdown
  const quickLinks = [
    { title: "Dashboard", path: "/patient/dashboard", icon: LayoutDashboard },
    { title: "AI Chatbot", path: "/patient/chatbot", icon: MessageSquare },
    { title: "Family Monitoring", path: "/patient/family-monitoring", icon: Users },
    { title: "Report Scanner", path: "/patient/report-scanner", icon: FileText },
    { title: "Profile", path: "/patient/profile", icon: User },
  ];

  const filteredLinks = globalSearchQuery 
    ? quickLinks.filter(link => link.title.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    : quickLinks;

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border shadow-soft relative z-40">
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setOpenSidebar(true)}
        className="lg:hidden sm:block bg-background/80 dark:bg-slate-900/80 hover:bg-background dark:hover:bg-slate-800 border border-border shadow-soft hover:shadow-medium transition-all duration-200"
        size="icon"
      >
        <AlignJustify className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Search Bar - Desktop */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search health data..."
            value={globalSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              dispatch(setSearchQuery(e.target.value));
              setIsSearchFocused(true);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />

          {/* Search Dropdown Box */}
          {isSearchFocused && (
            <div className="absolute top-full mt-2 w-full bg-card dark:bg-slate-900 border border-border shadow-large rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {globalSearchQuery && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 dark:bg-slate-800/50 border-b border-border">
                  Filtering current page for "{globalSearchQuery}"
                </div>
              )}
              <div className="p-2">
                {filteredLinks.length > 0 ? (
                  filteredLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.path}
                        onClick={() => {
                          navigate(link.path);
                          setIsSearchFocused(false);
                          dispatch(setSearchQuery("")); // clear search on navigate
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/10 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{link.title}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                    No navigation pages found. Press enter to search current page items.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={alertsRef}>
          <Button
            onClick={() => { setIsAlertsOpen(!isAlertsOpen); setUnreadCount(0); }}
            variant="ghost"
            size="icon"
            className="relative bg-background/50 dark:bg-slate-900/50 hover:bg-background dark:hover:bg-slate-800 border border-border shadow-soft hover:shadow-medium transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full border border-white text-[8px] flex items-center justify-center font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {isAlertsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border shadow-large rounded-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-border bg-muted/30 sticky top-0 backdrop-blur-md flex justify-between items-center z-10">
                <h3 className="font-bold text-sm">Family Alerts</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{alerts.length}</span>
              </div>
              <div className="p-2 space-y-1">
                {alerts.length > 0 ? (
                  alerts.map(alert => (
                    <div key={alert._id} onClick={() => { navigate('/patient/family-monitoring'); setIsAlertsOpen(false); }}
                      className={`p-3 rounded-lg text-sm border hover:bg-muted/50 cursor-pointer transition-colors ${alert.status === 'missed' ? 'border-red-500/20 bg-red-500/5' : 'border-violet-500/20 bg-violet-500/5'}`}>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-semibold" style={{ color: alert.status === 'missed' ? 'red' : 'violet' }}>
                          {alert.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground/90 text-xs leading-snug">{alert.action}</p>
                      {alert.groupId?.name && (
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold">Group: {alert.groupId.name}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <Bell className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    <p>No new alerts</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-soft hover:shadow-medium bg-background/80 dark:bg-slate-900/80 hover:bg-background dark:hover:bg-slate-800 border border-border transition-all duration-200 hover:scale-105"
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4" />
          {isLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </header>
  );
}

export default PatientHeader;
