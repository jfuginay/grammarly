import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AuthContext } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { createClient } from '@/util/supabase/component';

const ResetPasswordPage = () => {
  const router = useRouter();
  const { signIn } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();

  const validationSchema = Yup.object().shape({
    password: Yup.string()
      .required("Required")
      .min(8, "Must be at least 8 characters")
      .matches(/[a-zA-Z]/, "Must contain at least one letter")
      .matches(/[0-9]/, "Must contain at least one number"),
    confirmPassword: Yup.string()
      .required("Required")
      .oneOf([Yup.ref('password')], "Passwords must match"),
  });

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.updateUser({ password: values.password });
        
        if (error) throw error;

        // Sign in the user with the new password
        await signIn(data.user.email ?? '', values.password);

        // Redirect to dashboard or show success message
        router.push('/dashboard');
      } catch (error) {
        console.error('Error resetting password:', error);
        // Handle error (show error message to user)
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="flex h-screen bg-neutral-900 justify-center items-center">
      <div className="flex flex-col gap-7 h-[600px]">
        <div className="w-full flex justify-center cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>

        <form
          onSubmit={formik.handleSubmit}
          className="w-full md:w-[440px] p-0 md:p-12 rounded-lg bg-transparent md:bg-neutral-800 border-0 md:border border-neutral-700"
        >
          <div className="flex flex-col gap-6">
            <h2 className="font-medium text-2xl text-neutral-100 text-center">
              Reset Password
            </h2>

            <p className="text-sm text-neutral-300 text-center">
              Enter your new password below.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="text-sm text-neutral-300">New Password</label>
                  {formik.touched.password && formik.errors.password && (
                    <span className="text-red-500 text-xs">{formik.errors.password}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="w-full p-2.5 text-sm text-neutral-100 bg-neutral-700 border border-neutral-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your new password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEye className="text-neutral-400" /> : <FaEyeSlash className="text-neutral-400" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <label htmlFor="confirmPassword" className="text-sm text-neutral-300">Confirm New Password</label>
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <span className="text-red-500 text-xs">{formik.errors.confirmPassword}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="w-full p-2.5 text-sm text-neutral-100 bg-neutral-700 border border-neutral-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Confirm your new password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEye className="text-neutral-400" /> : <FaEyeSlash className="text-neutral-400" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2 text-sm font-medium text-neutral-100 bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition duration-200 ${
                isLoading || !formik.isValid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading || !formik.isValid}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="flex justify-center">
              <span
                className="text-primary-400 text-sm font-medium cursor-pointer hover:underline"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;