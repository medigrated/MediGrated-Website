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
    <nav className="mt-8 flex-col flex gap-2">
      {patientSidebarMenuItems.map((menuItem) => (
        <div
          key={menuItem.id}
          onClick={() => {
            navigate(menuItem.path);
            setOpen ? setOpen(false) : null;
          }}
          className="flex items-center text-xl gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          {menuItem.icon}
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
          className="w-64 pt-2 pr-2 [&>button]:top-2 [&>button]:right-2 [&>button]:scale-75 [&>button]:bg-gray-200 [&>button]:hover:bg-gray-300"
          aria-describedby="patient-panel-sidebar"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2 mt-6 mb-4 text-xl font-extrabold">
                <ChartNoAxesCombined size={30} />
                <span>Patient Panel</span>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background p-6 lg:flex">
        <div
          onClick={() => navigate("/patient/dashboard")}
          className="flex cursor-pointer items-center gap-2"
        >
          <ChartNoAxesCombined size={30} />
          <h1 className="text-2xl font-extrabold">Patient Panel</h1>
        </div>
        <MenuItems />
      </aside>
    </Fragment>
  );
}

export default PatientSidebar;
