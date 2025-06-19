import React from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const ResetPasswordPage = () => {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-neutral-900 justify-center items-center">
      <div className="flex flex-col gap-7 h-[600px]">
        <div className="w-full flex justify-center cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>
        <div className="bg-neutral-800 rounded-md px-12 py-10 w-[420px] flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-white mb-2">Password Reset</h1>
          <p className="text-neutral-300 mb-4">
            Password reset is not available. This application uses Google Sign-in only through Auth0.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition rounded-md text-white font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;