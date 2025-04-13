import SignInForm from "@/components/auth/SignInForm";

export const metadata = {
  title: "Sign In | NextJS Boilerplate",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex justify-center">
        <SignInForm />
      </div>
    </div>
  );
}
