// client/src/components/patient-view/layout.jsx
import { Outlet } from "react-router-dom";
import PatientSidebar from "./sidebar";
import PatientHeader from "./header";
import { useState } from "react";

function PatientLayout() {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-gradient-subtle">
      {/* Sidebar */}
      <PatientSidebar open={openSidebar} setOpen={setOpenSidebar} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <PatientHeader setOpenSidebar={setOpenSidebar} />
        <main className="flex-1 flex bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-4 md:p-6 lg:p-8 animate-fade-in">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default PatientLayout;

