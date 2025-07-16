import AuthForm from "@/components/AuthForm";
import GuestModeButton from "@/components/GuestModeButton";

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <AuthForm type="sign-in" />
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">or</p>
        <GuestModeButton />
      </div>
    </div>
  );
};

export default Page;
