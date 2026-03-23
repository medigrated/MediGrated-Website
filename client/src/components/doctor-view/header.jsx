import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlignJustify, LogOut, Bell, Search, 
  LayoutDashboard, FileText, MessageSquare, Settings, MapPin, User 
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/store/authSlice/authSlice";
import { setSearchQuery } from "@/store/searchSlice";
import { toast } from "sonner";
import { ThemeToggle } from "../ui/theme-toggle";

function DoctorHeader({ setOpenSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector(state => state.auth);
  const { globalSearchQuery } = useSelector((state) => state.search);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { title: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
    { title: "Patient Reports", path: "/doctor/reports", icon: FileText },
    { title: "AI Assistant", path: "/doctor/chatbot", icon: MessageSquare },
    { title: "Nearby Services", path: "/doctor/nearby", icon: MapPin },
    { title: "Settings", path: "/doctor/settings", icon: Settings },
    { title: "Profile", path: "/doctor/profile", icon: User },
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
            placeholder="Search patients or pages..."
            value={globalSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              dispatch(setSearchQuery(e.target.value));
              setIsSearchFocused(true);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all duration-200"
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
                          dispatch(setSearchQuery(""));
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-secondary/10 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-secondary" />
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
        <Button
          variant="ghost"
          size="icon"
          className="relative bg-background/50 dark:bg-slate-900/50 hover:bg-background dark:hover:bg-slate-800 border border-border shadow-soft hover:shadow-medium transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white"></span>
        </Button>

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
          {isLoading ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </header>
  );
}

export default DoctorHeader;