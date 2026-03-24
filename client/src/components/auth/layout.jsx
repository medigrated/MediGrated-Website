import { Outlet } from "react-router-dom";
import ThemeToggle from "@/components/ui/theme-toggle";

const AuthLayout = () => {
    return (
        <div className="flex min-h-screen w-full relative">
            {/* Theme Toggle Button */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            <div className="hidden lg:flex items-center justify-center bg-gradient-primary w-1/2 px-12">
                <div className="max-w-md space-y-6 text-center text-white">
                    <h1 className="text-5xl font-extrabold tracking-tight">MediGrated</h1>
                    <p className="text-lg text-white/80">Your AI-powered health companion</p>
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Outlet />
            </div>
        </div>
    );
}

export default AuthLayout;
