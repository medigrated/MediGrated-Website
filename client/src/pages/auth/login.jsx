import SharedForm from "@/components/shared/form";
import { useState } from "react";
import { Link } from "react-router-dom";
import { loginFormControls } from "@/config";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/store/authSlice/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Users, Activity } from "lucide-react";

const initialState = {
  email: "",
  password: "",
};

function AuthLogin() {
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  function onSubmit(e) {
    e.preventDefault();
    dispatch(loginUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast.success(data.payload.message || "Login successful!");

        //navigate based on role
        const role = data.payload.user.role;
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      } else {
        toast.error(data?.payload?.message || "Login failed!");
      }
    });
  }

  const features = [
    {
      icon: Heart,
      title: "Personalized Care",
      description: "AI-powered health recommendations tailored to your needs"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is protected with enterprise-grade security"
    },
    {
      icon: Users,
      title: "Family Management",
      description: "Manage medications and health for your entire family"
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Track medication schedules and receive timely reminders"
    }
  ];

  return (
    <div className="w-full flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-8">
        {/* Left Side - Features */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 animate-fade-in">
          <div className="text-left space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              MediGrated
            </h1>
            <p className="text-base text-muted-foreground">
              Revolutionizing healthcare management with AI-powered solutions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-background/70 dark:bg-slate-900/70 backdrop-blur-sm border border-border shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 animate-slide-up flex flex-col h-full"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="p-2.5 rounded-lg bg-gradient-primary w-fit mb-3">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-base mb-2 text-foreground leading-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-sm animate-slide-in flex items-center justify-center">
          <Card className="bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl border-border shadow-large">
            <CardHeader className="text-center pb-5 space-y-3">
              <div className="mx-auto p-4 rounded-2xl bg-gradient-primary w-fit">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-sm">
                  Sign in to your MediGrated account
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-8">
              <SharedForm
                formControls={loginFormControls}
                buttonText={isLoading ? "Signing in..." : "Sign In"}
                formData={formData}
                setFormData={setFormData}
                onSubmit={onSubmit}
              />

              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    className="font-medium text-primary hover:text-primary/80 transition-colors duration-200 underline underline-offset-4"
                    to="/auth/register"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Features Hint */}
          <div className="mt-8 text-center lg:hidden">
            <p className="text-muted-foreground text-sm">
              Join thousands of users managing their health with AI assistance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLogin;
