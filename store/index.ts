import { PostPrivacy } from "@prisma/client";
import { create } from "zustand";

type CreateDialogState = {
  openCreateDialog: boolean;
  setOpenCreateDialog: (open: boolean) => void;
};
type FileStoreState = {
  selectedFile: File[];
  isSelectedImageSafe: boolean;
};

type FileStoreActions = {
  setIsSelectedImageSafe: (isSafe: boolean) => void;
  setSelectedFile: (file: File[]) => void;
};

type ImageStore = {
  imageUrl: string | undefined;
  setImageUrl: (url: string | undefined) => void;
};

type PostState = {
  postPrivacy: PostPrivacy;
  setPostPrivacy: (privacy: PostPrivacy) => void;
};

export const useCreateDialog = create<CreateDialogState>((set) => ({
  openCreateDialog: false,
  setOpenCreateDialog: (open) => set({ openCreateDialog: open }),
}));

export const useFileStore = create<FileStoreState & FileStoreActions>(
  (set) => ({
    selectedFile: [],
    isSelectedImageSafe: true,
    setSelectedFile: (files) => set({ selectedFile: files }),
    setIsSelectedImageSafe: (isSafe) => set({ isSelectedImageSafe: isSafe }),
  })
);

export const useImageStore = create<ImageStore>((set) => ({
  imageUrl: "",
  setImageUrl: (url) => set({ imageUrl: url }),
}));

export const usePost = create<PostState>((set) => ({
  postPrivacy: PostPrivacy.ANYONE,
  setPostPrivacy: (privacy) => set({ postPrivacy: privacy }),
}));
