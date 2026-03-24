import {
  BotMessageSquare,
  ChartNoAxesCombined,
  FileScan,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Settings,
  UserRound,
} from "lucide-react";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

const patientSidebarMenuItems = [
  { id: "dashboard", label: "Dashboard", path: "/patient/dashboard", icon: <LayoutDashboard /> },
  { id: "chatbot", label: "AI Chatbot", path: "/patient/chatbot", icon: <BotMessageSquare /> },
  { id: "report-scanner", label: "Report Scanner", path: "/patient/report-scanner", icon: <FileScan /> },
  { id: "family-monitoring", label: "Family Monitoring", path: "/patient/family-monitoring", icon: <HeartPulse /> },
  { id: "profile", label: "Profile", path: "/patient/profile", icon: <UserRound /> },
];

function MenuItems({ setOpen }) {
  const navigate = useNavigate();

  return (
    <nav className="mt-8 flex-col flex gap-3">
      {patientSidebarMenuItems.map((menuItem) => (
        <div
          key={menuItem.id}
          onClick={() => {
            navigate(menuItem.path);
            setOpen ? setOpen(false) : null;
          }}
          className="flex items-center text-lg gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-background/80 dark:hover:bg-slate-800 hover:text-foreground cursor-pointer transition-all duration-200 hover:shadow-soft hover:scale-[1.02] group"
        >
          <div className="p-2 rounded-lg bg-gradient-accent text-white group-hover:scale-110 transition-transform duration-200">
            {menuItem.icon}
          </div>
          <span className="font-medium">{menuItem.label}</span>
        </div>
      ))}
    </nav>
  );
}

function PatientSidebar({ open, setOpen }) {
  const navigate = useNavigate();

  return (
    <Fragment>
      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 pt-4 pr-4 [&>button]:top-4 [&>button]:right-4 [&>button]:scale-90 [&>button]:bg-background/80 dark:[&>button]:bg-slate-800 [&>button]:hover:bg-background dark:[&>button]:hover:bg-slate-700 [&>button]:border [&>button]:border-border backdrop-blur-xl bg-background/95 dark:bg-slate-900/95"
          aria-describedby="patient-panel-sidebar"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className='border-b border-border pb-6'>
              <SheetTitle className="flex items-center gap-3 mt-6 mb-4 text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                <div className="p-3 rounded-xl bg-gradient-accent text-white shadow-lg">
                  <HeartPulse size={28} />
                </div>
                <span>Patient Panel</span>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-border bg-background/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 lg:flex shadow-large">
        <div
          onClick={() => navigate("/patient/dashboard")}
          className="flex cursor-pointer items-center gap-3 mb-8 group"
        >
          <div className="p-3 rounded-xl bg-gradient-accent text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
            <HeartPulse size={28} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">Patient Panel</h1>
        </div>
        <MenuItems />
      </aside>
    </Fragment>
  );
}

export default PatientSidebar;
