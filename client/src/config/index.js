export const loginFormControls = [
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email address",
    type: "email",
    componentType: "input",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    type: "password",
    componentType: "input",
  },
];

// Step 1: Account credentials
export const registerStep1Controls = [
  {
    name: "name",
    label: "Full Name",
    placeholder: "Enter your full name",
    type: "text",
    componentType: "input",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email",
    type: "email",
    componentType: "input",
    autoComplete: "off",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Create a password",
    type: "password",
    componentType: "input",
    autoComplete: "new-password",
  },
  {
    name: "isDoctor",
    label: "Role Selection",
    checkboxLabel: "I am registering as a Doctor",
    componentType: "checkbox",
  },
];

// Step 2: Personal information
export const registerStep2Controls = [
  {
    name: "phone",
    label: "Phone Number",
    placeholder: "e.g. +919876543210",
    type: "tel",
    componentType: "input",
  },
  {
    name: "gender",
    label: "Gender",
    placeholder: "Select your gender",
    componentType: "select",
    options: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
      { label: "Other", value: "other" },
      { label: "Prefer not to say", value: "prefer-not-to-say" },
    ],
  },
  {
    name: "dateOfBirth",
    label: "Date of Birth",
    placeholder: "Select date of birth",
    type: "date",
    componentType: "input",
  },
  {
    name: "location",
    label: "Location",
    placeholder: "City, State",
    type: "text",
    componentType: "input",
  },
];

// Step 3: Patient-specific fields
export const registerPatientStep3Controls = [
  {
    name: "bloodType",
    label: "Blood Type",
    placeholder: "Select your blood type",
    componentType: "select",
    options: [
      { label: "A+", value: "A+" },
      { label: "A-", value: "A-" },
      { label: "B+", value: "B+" },
      { label: "B-", value: "B-" },
      { label: "AB+", value: "AB+" },
      { label: "AB-", value: "AB-" },
      { label: "O+", value: "O+" },
      { label: "O-", value: "O-" },
    ],
  },
  {
    name: "allergies",
    label: "Allergies",
    placeholder: "List known allergies (comma-separated)",
    componentType: "textarea",
  },
  {
    name: "medicalHistory",
    label: "Medical History",
    placeholder: "Brief medical history or ongoing conditions",
    componentType: "textarea",
  },
  {
    name: "emergencyContact",
    label: "Emergency Contact",
    placeholder: "Emergency contact phone number",
    type: "tel",
    componentType: "input",
  },
];

// Step 3: Doctor-specific fields
export const registerDoctorStep3Controls = [
  {
    name: "specialization",
    label: "Specialization",
    placeholder: "e.g. Cardiologist, Dermatologist",
    type: "text",
    componentType: "input",
  },
  {
    name: "licenseNumber",
    label: "License Number",
    placeholder: "Medical license number",
    type: "text",
    componentType: "input",
  },
  {
    name: "experience",
    label: "Years of Experience",
    placeholder: "e.g. 5",
    type: "number",
    componentType: "input",
  },
  {
    name: "clinic",
    label: "Clinic / Hospital",
    placeholder: "Where you practice",
    type: "text",
    componentType: "input",
  },
  {
    name: "bio",
    label: "Professional Bio",
    placeholder: "Brief professional bio",
    componentType: "textarea",
  },
];

// Step 3: Admin-specific fields
export const registerAdminStep3Controls = [
  {
    name: "department",
    label: "Department",
    placeholder: "e.g. Administration, IT",
    type: "text",
    componentType: "input",
  },
  {
    name: "bio",
    label: "Bio",
    placeholder: "Brief description of your role",
    componentType: "textarea",
  },
];

// Legacy export for backward compatibility
export const registerFormControls = registerStep1Controls;
