// client/src/components/patient-view/header.jsx
import { Button } from "@/components/ui/button";
import { AlignJustify, LogOut, Bell, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/store/authSlice/authSlice";
import { toast } from "sonner";
import { ThemeToggle } from "../ui/theme-toggle";

function PatientHeader({ setOpenSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

 const handleLogout = async () => {
    try {
      const result = await dispatch(logoutUser()).unwrap();
      toast.success("Logged out successfully!");
      navigate("/auth/login");
    } catch (error) {
      toast.error(error?.message || "Failed to log out. Please try again.");
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border shadow-soft">
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
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search health data..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
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
          {isLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </header>
  );
}

export default PatientHeader;


