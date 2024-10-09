"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
import { fetcher, validateEmail } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      if (!collegeData) {
        toast.error("Invalid college email");
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
      } else {
        router.push("/");
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
              Login
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
                  className="space-y-3 sm:space-y-4"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Email address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Ex. 5000xxxxx@stu.upes.ac.in"
                              autoFocus
                              autoComplete="email"
                              className="text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm">
                            {isValidatingCollege ? (
                              <span className="text-yellow-500">
                                Validating college...
                              </span>
                            ) : collegeData && "name" in collegeData ? (
                              <span className="text-green-500">
                                Validated: {collegeData.name}
                              </span>
                            ) : collegeData && "error" in collegeData ? (
                              <span className="text-red-500">
                                Error: {collegeData.error}
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                The e-mail you used at the time of registration.
                              </span>
                            )}
                          </FormDescription>
                          <FormMessage className="text-xs sm:text-sm" />
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
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              className="text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Button
                      type="submit"
                      disabled={
                        isLoading ||
                        isValidatingCollege ||
                        !collegeData ||
                        "error" in collegeData
                      }
                      className="mt-4 w-full text-sm sm:mt-6 sm:text-base"
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
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
              Don&apos;t have an account?
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
                <Link href="/auth/signup">Create an account</Link>
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
