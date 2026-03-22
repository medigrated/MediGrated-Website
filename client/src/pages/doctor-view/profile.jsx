import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { authAPI } from '@/lib/api';
import { addActivity } from '@/store/activitySlice';
import { ACTIVITY_TYPES } from '@/lib/activityLogger';
import { Mail, Phone, MapPin, Briefcase, Edit2, Save, X, Lock, Camera, Award } from 'lucide-react';
import { ActivityFeed } from '@/components/shared/activity-feed';

export default function DoctorProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Dr. John Doe',
    email: user?.email || 'doctor@medigrated.com',
    phone: user?.phone || '+1234567890',
    specialization: user?.specialization || 'General Practitioner',
    licenseNumber: user?.licenseNumber || 'LIC-2024-001',
    bio: user?.bio || 'Experienced medical professional',
    clinic: user?.clinic || 'Medical Center',
    experience: user?.experience || '10+ years',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Prepare data for API - only send fields that should be updated
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        experience: parseInt(formData.experience) || null,
        clinic: formData.clinic,
      };

      await authAPI.updateProfile(profileData);

      dispatch(
        addActivity({
          type: ACTIVITY_TYPES.PROFILE_UPDATE,
          details: `Updated profile information`,
          user: formData.name,
          userName: formData.name,
          userRole: 'doctor',
        })
      );
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      dispatch(
        addActivity({
          type: ACTIVITY_TYPES.PASSWORD_CHANGE,
          details: `Changed account password`,
          user: formData.name,
          userName: formData.name,
          userRole: 'doctor',
        })
      );
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordMode(false);
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please check your current password and try again.');
    }
  };

  const handleLogout = () => {
    dispatch(
      addActivity({
        type: ACTIVITY_TYPES.LOGOUT,
        user: formData.name,
        userName: formData.name,
        userRole: 'doctor',
      })
    );
    navigate('/auth/login');
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="
        bg-gradient-secondary
        rounded-lg p-8 text-white
        relative overflow-hidden
      ">
        <div className="absolute top-0 right-0 opacity-10">
          <Award className="w-40 h-40" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="
              w-16 h-16 rounded-full
              bg-white/20 flex items-center justify-center
              text-3xl
            ">
              👨‍⚕️
            </div>
            <div>
              <h1 className="text-3xl font-bold">{formData.name}</h1>
              <p className="text-white/80">{formData.specialization}</p>
            </div>
          </div>
          <p className="text-white/90 max-w-2xl">{formData.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="
            bg-white dark:bg-slate-900
            border-gray-200 dark:border-slate-700
            p-6
          ">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Professional Information
              </h2>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Full Name</Label>
                {isEditing ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.phone}
                  </p>
                )}
              </div>

              {/* Specialization */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Specialization
                </Label>
                {isEditing ? (
                  <Input
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.specialization}
                  </p>
                )}
              </div>

              {/* License Number */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">License Number</Label>
                {isEditing ? (
                  <Input
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.licenseNumber}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Experience</Label>
                {isEditing ? (
                  <Input
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.experience}
                  </p>
                )}
              </div>

              {/* Clinic */}
              <div className="md:col-span-2">
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Clinic/Hospital
                </Label>
                {isEditing ? (
                  <Input
                    name="clinic"
                    value={formData.clinic}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.clinic}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <Label className="text-gray-700 dark:text-gray-300">Bio</Label>
                {isEditing ? (
                  <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="mt-2"
                    rows={3}
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.bio}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <Button
                  onClick={handleSaveProfile}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </Card>

          {/* Password Section */}
          <Card className="
            bg-white dark:bg-slate-900
            border-gray-200 dark:border-slate-700
            p-6
          ">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </h2>
              {!changePasswordMode && (
                <Button
                  onClick={() => setChangePasswordMode(true)}
                  variant="outline"
                  className="gap-2"
                >
                  Change Password
                </Button>
              )}
            </div>

            {changePasswordMode && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Current Password</Label>
                  <Input
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">New Password</Label>
                  <Input
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleChangePassword}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Update Password
                  </Button>
                  <Button
                    onClick={() => setChangePasswordMode(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="
            bg-white dark:bg-slate-900
            border-gray-200 dark:border-slate-700
            p-6
          ">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Role</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">Doctor</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Patients</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">45</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">2024</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="
            bg-white dark:bg-slate-900
            border-gray-200 dark:border-slate-700
            p-6
          ">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {}}
              >
                <Camera className="w-4 h-4" />
                Upload Avatar
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activities */}
      <Card className="
        bg-white dark:bg-slate-900
        border-gray-200 dark:border-slate-700
        p-6
      ">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activities
        </h2>
        <ActivityFeed limit={5} />
      </Card>
    </div>
  );
}
