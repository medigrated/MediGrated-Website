// client/src/components/doctor-view/sidebar.jsx
import { 
  BotMessageSquare, 
  ChartNoAxesCombined, 
  ClipboardPlus, 
  HeartPulse, 
  LayoutDashboard, 
  MapPin, 
  Menu, 
  Settings, 
  Stethoscope 
} from "lucide-react";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

const doctorSidebarMenuItems = [
  { id: "dashboard", label: "Dashboard", path: "/doctor/dashboard", icon: <LayoutDashboard /> },
  { id: "reports", label: "Reports Review", path: "/doctor/reports", icon: <ClipboardPlus /> },
  { id: "chatbot", label: "Chatbot Assistant", path: "/doctor/chatbot", icon: <BotMessageSquare /> },
  { id: "settings", label: "Profile Settings", path: "/doctor/settings", icon: <Settings /> },
];

function MenuItems({ setOpen }) {
  const navigate = useNavigate();

  return (
    <nav className="mt-8 flex-col flex gap-2">
      {doctorSidebarMenuItems.map((menuItem) => (
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

function DoctorSidebar({ open, setOpen }) {
  const navigate = useNavigate();

  return (
    <Fragment>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-64 pt-2 pr-2 [&>button]:top-2 [&>button]:right-2 [&>button]:scale-75 [&>button]:bg-gray-200 [&>button]:hover:bg-gray-300"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2 mt-6 mb-4 text-xl font-extrabold">
                <ChartNoAxesCombined size={30} />
                <span>Doctor Panel</span>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden w-64 flex-col border-r bg-background p-6 lg:flex">
        <div
          onClick={() => navigate("/doctor/dashboard")}
          className="flex cursor-pointer items-center gap-2"
        >
          <ChartNoAxesCombined size={30} />
          <h1 className="text-2xl font-extrabold">Doctor Panel</h1>
        </div>
        <MenuItems />
      </aside>
    </Fragment>
  );
}

export default DoctorSidebar;
