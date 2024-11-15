"use client";

import useWindow from "@/hooks/use-window";
import { useEditProfileDialog } from "@/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import { ProfileData, ProfileUpdateData } from "@/types/profile";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  bio: z.string().max(180).optional(),
  isPrivate: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

type EditProfileDialogProps = {
  initialData: ProfileUpdateData;
  className?: string;
};

function Content({ initialData, className }: EditProfileDialogProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const { setOpenEditProfileDialog } = useEditProfileDialog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: initialData.username,
      bio: initialData.bio ?? "",
      isPrivate: initialData.privacy === "PRIVATE",
    },
  });

  const username = form.watch("username");
  const debouncedUsername = useDebounce(username, 500);

  const { data: usernameAvailability, isLoading: isValidatingUsername } =
    useQuery({
      queryKey: ["checkUsername", debouncedUsername],
      queryFn: async () => {
        if (debouncedUsername === initialData.username) {
          return { available: true, isInitial: true };
        }
        const [data] = await fetcher<{ available: boolean; error?: string }>(
          `/api/checkUserNameAvailability?username=${debouncedUsername}`
        );
        return { ...data, isInitial: false };
      },
      enabled: !!debouncedUsername && debouncedUsername.length >= 3,
    });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (values: ProfileUpdateData) =>
      fetcher<ProfileData>(`/api/profile/${session?.user.username}/edit`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      const newUsername = form.getValues("username");

      await Promise.all([
        update({
          user: { ...session?.user, username: newUsername },
        }),
        queryClient.prefetchQuery({
          queryKey: ["profile", `@${newUsername}`],
          queryFn: () => fetcher<ProfileData>(`/api/profile/${newUsername}`),
        }),
      ]);

      setOpenEditProfileDialog(false);
      router.prefetch(`/profile/@${newUsername}`);

      if (initialData.username !== newUsername) {
        router.push(`/profile/@${newUsername}`);
      }

      toast.success("Profile updated");
    },
    onError: (err: Error) => {
      toast.error("Error updating profile", {
        description: err.message,
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!usernameAvailability?.available) {
      toast.error("Username is not available");
      return;
    }

    updateProfile({
      username: values.username,
      bio: values.bio || null,
      privacy: values.isPrivate ? "PRIVATE" : "PUBLIC",
    } as const);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="relative flex w-full items-center justify-center border-b border-border p-2">
        <h1 className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
          Edit Profile
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={TRANSITION}
          className="absolute left-2 rounded-md px-2 py-1 hover:bg-muted"
          onClick={() => setOpenEditProfileDialog(false)}
        >
          Cancel
        </motion.button>
      </div>

      {/* Body */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <div className="flex-1 space-y-4 p-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs sm:text-sm">
                    {isValidatingUsername ? (
                      <span className="text-yellow-500">
                        Checking availability...
                      </span>
                    ) : usernameAvailability?.available &&
                      !usernameAvailability.isInitial ? (
                      <span className="text-green-500">
                        Username is available
                      </span>
                    ) : usernameAvailability?.error ? (
                      <span className="text-red-500">
                        Error: {usernameAvailability.error}
                      </span>
                    ) : !usernameAvailability?.available ? (
                      <span className="text-red-500">
                        Username is not available
                      </span>
                    ) : null}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {180 - (field.value?.length || 0)} characters left
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2.5 rounded-lg border border-border p-2.5">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <FormLabel className="text-sm">Private Account</FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Only followers can see your posts and interactions
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
            <motion.button
              type="submit"
              disabled={
                isPending ||
                isValidatingUsername ||
                !usernameAvailability?.available
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={TRANSITION}
              className="rounded-md bg-primary px-4 py-1.5 text-white disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function EditProfileDialog({
  initialData,
}: EditProfileDialogProps) {
  const { isMobile } = useWindow();
  const { openEditProfileDialog, setOpenEditProfileDialog } =
    useEditProfileDialog();

  const content = (
    <Content initialData={initialData} className={isMobile ? "pt-2" : ""} />
  );

  if (isMobile) {
    return (
      <Drawer
        open={openEditProfileDialog}
        onOpenChange={setOpenEditProfileDialog}
      >
        <DrawerContent className="h-[100dvh]">
          <DrawerTitle className="sr-only">Edit Profile</DrawerTitle>
          <DrawerDescription className="sr-only">
            Make changes to your profile here
          </DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={openEditProfileDialog}
      onOpenChange={setOpenEditProfileDialog}
    >
      <DialogContent className="min-h-[25dvh] min-w-[30dvw] p-0" hideClose>
        <DialogTitle className="sr-only">Edit Profile</DialogTitle>
        <DialogDescription className="sr-only">
          Make changes to your profile here
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}
