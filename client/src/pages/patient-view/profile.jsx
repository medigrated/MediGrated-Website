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
import { Mail, Phone, MapPin, Heart, Edit2, Save, X, Lock, Camera, AlertCircle, Calendar, Users, Upload, Loader2 } from 'lucide-react';
import { ActivityFeed } from '@/components/shared/activity-feed';
import { logoutUser, setUser } from '@/store/authSlice/authSlice';
import { toast } from 'sonner';
import { WebcamDialog } from '@/components/shared/webcam-dialog';

function PatientProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const fileInputRef = React.useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    age: user?.age || '',
    bloodType: user?.bloodType || '',
    allergies: user?.allergies || '',
    medicalHistory: user?.medicalHistory || '',
    emergencyContact: user?.emergencyContact || '',
    location: user?.location || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const displayValue = (val) => val || 'Not set';
  const genderLabel = (g) => {
    const map = { male: 'Male', female: 'Female', other: 'Other', 'prefer-not-to-say': 'Prefer not to say' };
    return map[g] || 'Not set';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        location: formData.location,
        age: parseInt(formData.age) || null,
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        medicalHistory: formData.medicalHistory,
        emergencyContact: formData.emergencyContact,
      };

      await authAPI.updateProfile(profileData);

      dispatch(
        addActivity({
          type: ACTIVITY_TYPES.PROFILE_UPDATE,
          details: `Updated health profile information`,
          user: formData.name,
          userName: formData.name,
          userRole: 'patient',
        })
      );
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setIsSavingPassword(true);
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
          userRole: 'patient',
        })
      );
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordMode(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please check your current password and try again.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(
        addActivity({
          type: ACTIVITY_TYPES.LOGOUT,
          user: formData.name,
          userName: formData.name,
          userRole: 'patient',
        })
      );
      toast.success("Logged out successfully!");
      navigate('/auth/login');
    } catch (error) {
      toast.error(error?.message || "Failed to log out. Please try again.");
      console.error("Logout failed:", error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', file);
        const response = await authAPI.uploadAvatar(formDataUpload);
        
        dispatch(setUser(response.data.user));
        toast.success("Avatar uploaded successfully!");
      } catch (err) {
        console.error("Avatar upload failed:", err);
        toast.error("Failed to upload avatar");
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="
        bg-gradient-accent
        rounded-lg p-8 text-white
        relative overflow-hidden
      ">
        <div className="absolute top-0 right-0 opacity-10">
          <Heart className="w-40 h-40" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="
              w-16 h-16 rounded-full
              bg-white/20 flex items-center justify-center
              text-3xl overflow-hidden shadow-inner border-2 border-white/30
            ">
              {user?.avatar ? (
                <img src={`http://localhost:5000${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                "🧑‍🦱"
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{displayValue(formData.name)}</h1>
              <p className="text-white/80">Age: {formData.age ? `${formData.age} years` : 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <p>Blood Type: <span className="font-bold">{displayValue(formData.bloodType)}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <p>Gender: <span className="font-bold">{genderLabel(formData.gender)}</span></p>
            </div>
          </div>
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
                Health Profile
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
                  <Input name="name" value={formData.name} onChange={handleInputChange} className="mt-2" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{displayValue(formData.name)}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{displayValue(formData.email)}</p>
              </div>

              {/* Phone */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </Label>
                {isEditing ? (
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} className="mt-2" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{displayValue(formData.phone)}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Gender
                </Label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-2 w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{genderLabel(formData.gender)}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date of Birth
                </Label>
                {isEditing ? (
                  <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} className="mt-2" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Age</Label>
                {isEditing ? (
                  <Input name="age" type="number" value={formData.age} onChange={handleInputChange} className="mt-2" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">
                    {formData.age ? `${formData.age} years` : 'Not set'}
                  </p>
                )}
              </div>

              {/* Blood Type */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Blood Type
                </Label>
                {isEditing ? (
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="mt-2 w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select blood type</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-bold">{displayValue(formData.bloodType)}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Emergency Contact</Label>
                {isEditing ? (
                  <Input name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} className="mt-2" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{displayValue(formData.emergencyContact)}</p>
                )}
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </Label>
                {isEditing ? (
                  <Input name="location" value={formData.location} onChange={handleInputChange} className="mt-2" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{displayValue(formData.location)}</p>
                )}
              </div>

              {/* Allergies */}
              <div className="md:col-span-1">
                <Label className="text-gray-700 dark:text-gray-300">Allergies</Label>
                {isEditing ? (
                  <Textarea name="allergies" value={formData.allergies} onChange={handleInputChange} className="mt-2" rows={2} placeholder="List any allergies" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{displayValue(formData.allergies)}</p>
                )}
              </div>

              {/* Medical History */}
              <div className="md:col-span-1">
                <Label className="text-gray-700 dark:text-gray-300">Medical History</Label>
                {isEditing ? (
                  <Textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} className="mt-2" rows={2} placeholder="List medical conditions" />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{displayValue(formData.medicalHistory)}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-2 bg-primary hover:bg-primary/90 flex-1 md:flex-none">
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={() => setIsEditing(false)} disabled={isSavingProfile} variant="outline" className="gap-2 flex-1 md:flex-none">
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            )}
          </Card>

          {/* Password Section */}
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Security
              </h2>
              {!changePasswordMode && (
                <Button onClick={() => setChangePasswordMode(true)} variant="outline" className="gap-2">
                  Change Password
                </Button>
              )}
            </div>

            {changePasswordMode && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Current Password</Label>
                  <Input name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} className="mt-2 border-2 border-gray-200 dark:border-slate-700 focus:border-primary transition-colors" />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">New Password</Label>
                  <Input name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} className="mt-2 border-2 border-gray-200 dark:border-slate-700 focus:border-primary transition-colors" />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
                  <Input name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="mt-2 border-2 border-gray-200 dark:border-slate-700 focus:border-primary transition-colors" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleChangePassword} disabled={isSavingPassword} className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                    {isSavingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSavingPassword ? "Updating Password..." : "Update Password"}
                  </Button>
                  <Button onClick={() => setChangePasswordMode(false)} disabled={isSavingPassword} variant="outline">Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Health Info */}
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Health Summary</h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Allergies</p>
                <p className="font-bold text-red-600 dark:text-red-400">{displayValue(formData.allergies)}</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Blood Type</p>
                <p className="font-bold text-yellow-600 dark:text-yellow-400">{displayValue(formData.bloodType)}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">Active Patient</p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Role</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">Patient</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Gender</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{genderLabel(formData.gender)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Location</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{displayValue(formData.location)}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Actions</h3>
            <div className="space-y-2 relative">
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 relative z-10" 
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isUploadingAvatar ? "Uploading Avatar..." : "Change Avatar"}
              </Button>

              {showAvatarMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowAvatarMenu(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                      onClick={() => { setShowAvatarMenu(false); fileInputRef.current?.click(); }}
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      Upload from Device
                    </button>
                    <button 
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left border-t border-gray-100 dark:border-slate-700"
                      onClick={() => { setShowAvatarMenu(false); setShowWebcam(true); }}
                    >
                      <Camera className="w-4 h-4 text-primary" />
                      Take Photo
                    </button>
                  </div>
                </>
              )}

              <WebcamDialog 
                isOpen={showWebcam} 
                onClose={() => setShowWebcam(false)} 
                onCapture={(file) => handleAvatarUpload({ target: { files: [file] } })} 
              />

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
      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activities
        </h2>
        <ActivityFeed limit={5} />
      </Card>
    </div>
  );
}

export default PatientProfile;
