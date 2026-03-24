import { Navigate, useLocation } from "react-router-dom";

function CheckAuth({ isAuthenticated, user, children }) {

    const location = useLocation();

    if (!isAuthenticated && !(location.pathname.includes('/login') || location.pathname.includes('/register'))) {
        return <Navigate to="/auth/login" />;
    }

    if (isAuthenticated && (location.pathname.includes('/login') || location.pathname.includes('/register'))) { 
        if(user?.role === 'admin') {
            return <Navigate to="/admin/dashboard" />;
        }
        else if(user?.role === 'doctor') {
            return <Navigate to="/doctor/dashboard" />;
        }
        else {
            return <Navigate to="/patient/dashboard" />;
        }
    }

    if(isAuthenticated && user?.role !== 'admin' && location.pathname.includes('admin')) {
        return <Navigate to="/unauth-page" />;
    }

    if(isAuthenticated && user?.role !== 'doctor' && location.pathname.includes('doctor')) {
        return <Navigate to="/unauth-page" />;
    }

    if(isAuthenticated && user?.role !== 'patient' && location.pathname.includes('patient')) {
        return <Navigate to="/unauth-page" />;
    }

    return <>{children}</>;
}

export default CheckAuth;
