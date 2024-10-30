import useWindow from "@/hooks/use-window";
import { useCreateDialog } from "@/store";
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
import { Content } from "./content";

export function CreateDialog() {
  const { isMobile } = useWindow();
  const { openCreateDialog, setOpenCreateDialog } = useCreateDialog();

  const content = <Content className={isMobile ? "pt-2" : ""} />;

  if (isMobile) {
    return (
      <Drawer open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DrawerContent className="h-[100dvh]">
          <DrawerTitle className="sr-only">Create New Echo</DrawerTitle>
          <DrawerDescription className="sr-only">
            Create a new echo to share with your followers
          </DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
      <DialogContent className="min-h-[25dvh] min-w-[30dvw] p-0" hideClose>
        <DialogTitle className="sr-only">Create New Echo</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new echo to share with your followers
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}
