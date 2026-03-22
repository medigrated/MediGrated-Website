// client/src/components/admin-view/layout.jsx
import { Outlet } from "react-router-dom"
import AdminSidebar from "./sidebar"
import AdminHeader from "./header"
import { useState } from "react"

function AdminLayout () {

    const [openSidebar, setOpenSidebar] = useState(false);

    return (
        <div className="flex min-h-screen w-full bg-gradient-subtle">
            {/*sidebar*/}
            <AdminSidebar open={openSidebar} setOpen={setOpenSidebar} />
            <div className="flex flex-1 flex-col">
                {/*header*/}
                <AdminHeader setOpenSidebar={setOpenSidebar} />
                <main className="flex-1 flex bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-4 md:p-6 lg:p-8 animate-fade-in">
                    <div className="w-full max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout;