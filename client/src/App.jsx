import { useEffect, useState } from 'react'
import './App.css'
import { Routes, Navigate } from 'react-router-dom'
import { Route } from 'react-router-dom'
import CheckAuth from './components/shared/check-auth'
import AuthLayout from './components/auth/layout'
import AuthLogin from './pages/auth/login'
import AuthRegister from './pages/auth/register'
import AdminLayout from './components/admin-view/layout'
import AdminDashboard from './pages/admin-view/dashboard'
import AdminUsers from './pages/admin-view/users'
import AdminReports from './pages/admin-view/reports'
import AdminLocations from './pages/admin-view/locations'
import AdminChatbot from './pages/admin-view/chatbot'
import AdminLogs from './pages/admin-view/logs'
import AdminSettings from './pages/admin-view/settings'
import DoctorLayout from './components/doctor-view/layout'
import DoctorDashboard from './pages/doctor-view/dashboard'
import PatientLayout from './components/patient-view/layout'
import PatientDashboard from './pages/patient-view/dashboard'
import PatientChatbot from './pages/patient-view/chatbot'
import FamilyMonitoring from './pages/patient-view/family-monitoring'
import HealthData from './pages/patient-view/health-data'
import PatientProfile from './pages/patient-view/profile'
import ReportScanner from './pages/patient-view/report-scanner'
import Recommendations from './pages/patient-view/recommendations'
import NotFound from './pages/not-found'
import UnauthPage from './pages/unauth-page'
import { useSelector, useDispatch } from 'react-redux'
import { checkAuth } from './store/authSlice/authSlice'
import { Skeleton } from './components/ui/skeleton'
import DoctorReports from './pages/doctor-view/reports'
import DoctorChatbot from './pages/doctor-view/chatbot'
import DoctorSettings from './pages/doctor-view/settings'
import DoctorNearby from './pages/doctor-view/nearby'

function App() {

  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return <Skeleton className='h-screen w-full bg-black' />;
  }

  return (
    <div className='flex flex-col overflow-hidden bg-white'>


      <Routes>
        {/* redirect base URL to authentication flow; CheckAuth will further redirect logged-in users */}
        <Route path="/" element={<Navigate to="/auth/login" />} />
        <Route path="/auth" element={
          <CheckAuth isAuthenticated={isAuthenticated} user={user}>
            <AuthLayout />
          </CheckAuth>
        } >
          <Route path="login" element={<AuthLogin />} />
          <Route path="register" element={<AuthRegister />} />
        </Route>

        <Route path="/admin" element={
          <CheckAuth isAuthenticated={isAuthenticated} user={user}>
            <AdminLayout />
          </CheckAuth>
        } >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="chatbot" element={<AdminChatbot />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/doctor" element={
          <CheckAuth isAuthenticated={isAuthenticated} user={user}>
            <DoctorLayout />
          </CheckAuth>
        } >
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="reports" element={<DoctorReports />} />
          <Route path="chatbot" element={<DoctorChatbot />} />
          <Route path="settings" element={<DoctorSettings />} />
          <Route path="nearby" element={<DoctorNearby />} />
        </Route>

        <Route path="/patient" element={
          <CheckAuth isAuthenticated={isAuthenticated} user={user}>
            <PatientLayout />
          </CheckAuth>
        } >
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="chatbot" element={<PatientChatbot />} />
          <Route path="family-monitoring" element={<FamilyMonitoring />} />
          <Route path="health-data" element={<HealthData />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="report-scanner" element={<ReportScanner />} />
          <Route path="recommendations" element={<Recommendations />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        <Route path="/unauth-page" element={<UnauthPage />} />
      </Routes>
    </div>

  )
}

export default App
