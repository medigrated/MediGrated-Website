import SharedForm from "@/components/shared/form";
import { useState } from "react";
import { Link } from "react-router-dom";
import { registerFormControls } from "@/config";
import { useDispatch } from "react-redux";
import { registerUser } from "@/store/authSlice/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="mt-2">Already have an account?
          <Link className="font-medium text-primary ml-2 hover:underline" to='/auth/login'>Log in</Link>
        </p>
      </div>
      <SharedForm
        formControls={registerFormControls}
        buttonText={'Sign Up'}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
      />
    </div>
  )
}

export default AuthRegister;
