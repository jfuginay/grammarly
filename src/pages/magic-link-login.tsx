import React, { useContext, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface FormValues {
  email: string;
}

const MagicLinkLoginPage = () => {
  const router = useRouter();
  const { initializing, signInWithMagicLink } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await signInWithMagicLink(values.email);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const validationSchema = Yup.object().shape({
    email: Yup.string().required("Email is required").email("Email is invalid"),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: handleLogin,
  });

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      formik.handleSubmit();
    }
  };

  return (
    <div className="flex h-screen bg-background justify-center items-center">
      <div className="flex flex-col gap-5 h-auto">
        <div className="w-full flex justify-center cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>

        <Card className="w-full md:w-[440px]" onKeyDown={handleKeyPress}>
          <CardHeader>
            <CardTitle className="text-center">Magic Link Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={formik.handleSubmit}>
              <div className="flex flex-col gap-6">
                <p className="text-center text-sm text-muted-foreground">
                  Enter your email to receive a magic link
                </p>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-destructive text-xs">{formik.errors.email}</p>
                  )}
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span>Need an account?</span>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0"
                      onClick={() => router.push('/signup')}
                    >
                      Sign up
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || initializing || !formik.values.email || !formik.isValid}
                >
                  Send Magic Link
                </Button>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0"
                    onClick={() => router.push('/login')}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MagicLinkLoginPage;