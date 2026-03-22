import SharedForm from "@/components/shared/form";
import { useState } from "react";
import { Link } from "react-router-dom";
import { registerFormControls } from "@/config";
import { useDispatch } from "react-redux";
import { registerUser } from "@/store/authSlice/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const initialState = {
  name: "",
  role: "",
  email: "",
  password: ""
};

function AuthRegister() {

  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();



  function onSubmit(e) {
    e.preventDefault();
    dispatch(registerUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast.success(data.payload.message || "User registered successfully!");
        const role = data?.payload?.user?.role;
        if (role === 'admin') navigate("/admin/dashboard");
        else if (role === 'doctor') navigate("/doctor/dashboard");
        else navigate("/patient/dashboard");
      } else {
        toast.error(data?.payload?.message || "Registration failed!");
      }
    });
  }
  //what this does is, it handles the form submission by dispatching the registerUser action with the form data. It then checks the response to see if the registration was successful or not, and shows a toast notification accordingly. If successful, it navigates the user to the login page.

  console.log(formData);

  return (
    <div className="w-full max-w-sm animate-slide-in">
      <Card className="bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl border-border shadow-large">
        <CardHeader className="text-center pb-5 space-y-3">
          <div className="mx-auto p-4 rounded-2xl bg-gradient-primary w-fit">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-sm">
              Join MediGrated and start your health journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-8">
          <SharedForm
            formControls={registerFormControls}
            buttonText={'Create Account'}
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
          />

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
  )
}

export default AuthRegister;
