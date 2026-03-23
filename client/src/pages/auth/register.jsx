import SharedForm from "@/components/shared/form";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  registerStep1Controls,
  registerStep2Controls,
  registerPatientStep3Controls,
  registerDoctorStep3Controls,
  registerAdminStep3Controls,
} from "@/config";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "@/store/authSlice/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, ArrowRight, User, FileText, Stethoscope, Loader2 } from "lucide-react";

const initialState = {
  name: "",
  email: "",
  password: "",
  isDoctor: false,
  phone: "",
  gender: "",
  dateOfBirth: "",
  location: "",
  age: "",
  bloodType: "",
  allergies: "",
  medicalHistory: "",
  emergencyContact: "",
  specialization: "",
  licenseNumber: "",
  experience: "",
  clinic: "",
  bio: "",
  department: "",
};

const steps = [
  { title: "Account", description: "Create your credentials", icon: Shield },
  { title: "Personal Info", description: "Tell us about yourself", icon: User },
  { title: "Role Details", description: "Role-specific information", icon: Stethoscope },
];

function AuthRegister() {
  const [formData, setFormData] = useState(initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  function getStep3Controls() {
    return formData.isDoctor ? registerDoctorStep3Controls : registerPatientStep3Controls;
  }

  function getStepControls() {
    switch (currentStep) {
      case 0:
        return registerStep1Controls;
      case 1:
        return registerStep2Controls;
      case 2:
        return getStep3Controls();
      default:
        return [];
    }
  }

  function canProceed() {
    if (currentStep === 0) {
      return formData.name && formData.email && formData.password;
    }
    return true;
  }

  function handleNext(e) {
    e.preventDefault();
    if (!canProceed()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 2));
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  function onSubmit(e) {
    e.preventDefault();
    
    // Calculate age from dateOfBirth
    let computedAge = formData.age;
    if (formData.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(formData.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        computedAge = age;
    }

    const payloadData = {
      ...formData,
      age: computedAge,
      role: formData.isDoctor ? "doctor" : "patient"
    };

    dispatch(registerUser(payloadData)).then((data) => {
      if (data?.payload?.success) {
        toast.success(data.payload.message || "Account created successfully!");
        const role = data?.payload?.user?.role;
        if (role === "admin") navigate("/admin/dashboard");
        else if (role === "doctor") navigate("/doctor/dashboard");
        else navigate("/patient/dashboard");
      } else {
        toast.error(data?.payload?.message || "Registration failed!");
      }
    });
  }

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="w-full max-w-md animate-slide-in">
      <Card className="bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl border-border shadow-large">
        <CardHeader className="text-center pb-4 space-y-3">
          <div className="mx-auto p-4 rounded-2xl bg-gradient-primary w-fit">
            <StepIcon className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-sm">
              {steps[currentStep].description}
            </CardDescription>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${index < currentStep
                      ? "bg-green-500 text-white shadow-md"
                      : index === currentStep
                        ? "bg-gradient-primary text-white shadow-lg scale-110"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 transition-all duration-300 ${
                      index < currentStep ? "bg-green-500" : "bg-gray-200 dark:bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-8">
          {currentStep < 2 ? (
            <form onSubmit={handleNext}>
              <SharedForm
                formControls={getStepControls()}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleNext}
                buttonText={null}
                hideButton={true}
              />
              <div className="flex gap-3 mt-6">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1 gap-2 bg-gradient-primary hover:opacity-90 text-white font-semibold"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onSubmit}>
              <SharedForm
                formControls={getStepControls()}
                formData={formData}
                setFormData={setFormData}
                onSubmit={onSubmit}
                buttonText={null}
                hideButton={true}
              />
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 gap-2 bg-gradient-primary hover:opacity-90 text-white font-semibold flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="font-medium text-primary hover:text-primary/80 transition-colors duration-200 underline underline-offset-4"
                to="/auth/login"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthRegister;
