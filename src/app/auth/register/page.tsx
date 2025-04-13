import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Register | NextJS Boilerplate",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex justify-center">
        <RegisterForm />
      </div>
    </div>
  );
}
