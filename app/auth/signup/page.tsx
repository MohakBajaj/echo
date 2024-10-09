"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import {
  fetcher,
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/lib/utils";
import { signIn } from "next-auth/react";

const formSchema = z.object({
  username: z.string().refine(validateUsername, {
    message:
      "Username must be 5-50 characters long and can only contain letters, numbers, dots, and underscores",
  }),
  email: z.string().refine(validateEmail, {
    message: "Invalid email address",
  }),
  verificationCode: z
    .string()
    .length(15, "Verification code must be 15 characters"),
  password: z.string().refine(validatePassword, {
    message:
      "Password must be 8-50 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  }),
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      verificationCode: "",
      password: "",
    },
  });

  const email = form.watch("email");
  const debouncedEmail = useDebounce(email, 500);

  const isValidEmail = validateEmail(debouncedEmail);

  const { data: collegeData, isLoading: isValidatingCollege } = useQuery({
    queryKey: ["validateCollege", debouncedEmail],
    queryFn: async () => {
      const [data] = await fetcher<
        | {
            id: string;
            name: string;
          }
        | {
            error: string;
          }
      >(`/api/validateCollege?email=${debouncedEmail}`);
      return data;
    },
    enabled: !!debouncedEmail && isValidEmail,
  });

  const username = form.watch("username");
  const debouncedUsername = useDebounce(username, 500);

  const isValidUsername = validateUsername(debouncedUsername);

  const { data: usernameData, isLoading: isValidatingUsername } = useQuery({
    queryKey: ["validateUsername", debouncedUsername],
    queryFn: async () => {
      const [data] = await fetcher<
        | {
            available: boolean;
          }
        | {
            error: string;
          }
      >(`/api/checkUserNameAvailability?username=${debouncedUsername}`);
      return data;
    },
    enabled: !!debouncedUsername && isValidUsername,
  });

  const sendVerificationCode = async () => {
    try {
      const [response, status] = await fetcher("/api/verifyCollege/send", {
        method: "POST",
        body: JSON.stringify({ email: debouncedEmail }),
      });
      if (status === 200) {
        setIsVerificationSent(true);
        toast.success("Verification code sent to your email");
      } else {
        toast.error(
          (response as { error?: string }).error ||
            "Failed to send verification code"
        );
        setIsVerificationSent(false);
        setCodeSending(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send verification code");
    }
  };

  const verifyCode = async (code: string) => {
    try {
      const [response, status] = await fetcher("/api/verifyCollege/verify", {
        method: "POST",
        body: JSON.stringify({ email: debouncedEmail, code }),
      });
      if (status === 200) {
        setIsEmailVerified(true);
        toast.success("Email verified successfully");
      } else {
        toast.error(
          (response as { error?: string }).error || "Invalid verification code"
        );
        setIsEmailVerified(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to verify code");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isEmailVerified) {
      toast.error("Please verify your email before signing up");
      return;
    }

    setIsLoading(true);
    try {
      const [response, status] = await fetcher("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (status === 201) {
        toast.success("Account created successfully!");
        // Sign in the user after successful signup
        const result = await signIn("credentials", {
          redirect: false,
          email: values.email,
          password: values.password,
        });

        if (result?.error) {
          toast.error("Failed to sign in after signup. Please try logging in.");
        } else {
          router.push("/");
        }
      } else {
        toast.error(
          (response as { error?: string }).error || "Failed to create account"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen w-full items-center justify-center bg-background"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Card className="mx-auto w-full min-w-[20rem] max-w-md md:min-w-[22rem] lg:min-w-[28rem]">
          <CardHeader>
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center font-[family-name:var(--font-poppins)] text-2xl font-extrabold sm:text-3xl"
            >
              Signup
            </motion.h2>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <Form {...form}>
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {isValidatingUsername ? (
                              "Checking username availability..."
                            ) : usernameData && "available" in usernameData ? (
                              usernameData.available ? (
                                <span className="text-green-500">
                                  Username is available
                                </span>
                              ) : (
                                <span className="text-red-500">
                                  Username is already taken
                                </span>
                              )
                            ) : null}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                disabled={
                                  isVerificationSent ||
                                  isEmailVerified ||
                                  codeSending
                                }
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              onClick={() => {
                                setCodeSending(true);
                                sendVerificationCode();
                              }}
                              disabled={
                                !isValidEmail ||
                                isEmailVerified ||
                                isVerificationSent ||
                                codeSending
                              }
                            >
                              {isVerificationSent ? "Sent" : "Send Code"}
                            </Button>
                          </div>
                          <FormDescription>
                            {isValidatingCollege ? (
                              "Validating college..."
                            ) : collegeData && "name" in collegeData ? (
                              <span className="text-green-500">
                                Validated: {collegeData.name}
                              </span>
                            ) : collegeData && "error" in collegeData ? (
                              <span className="text-red-500">
                                Error: {collegeData.error}
                              </span>
                            ) : null}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  {isVerificationSent && !isEmailVerified && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FormField
                        control={form.control}
                        name="verificationCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Code</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input
                                  placeholder="Enter verification code"
                                  type="text"
                                  maxLength={15}
                                  disabled={verifyingCode}
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                onClick={() => {
                                  setVerifyingCode(true);
                                  verifyCode(field.value);
                                }}
                                disabled={verifyingCode}
                              >
                                {verifyingCode ? "Verifying..." : "Verify"}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !isEmailVerified}
                    >
                      {isLoading ? "Signing up..." : "Sign up"}
                    </Button>
                  </motion.div>
                </motion.form>
              </Form>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Separator className="my-3 sm:my-4" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-3 text-center text-xs text-gray-500 sm:mb-4 sm:text-sm"
            >
              Already have an account?
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-full"
            >
              <Button
                asChild
                variant="outline"
                className="w-full text-sm sm:text-base"
              >
                <Link href="/auth/login">Go to Login</Link>
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
