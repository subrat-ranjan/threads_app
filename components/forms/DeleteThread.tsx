"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { deleteThread } from "@/lib/actions/threads.actions";

interface Props {
  threadId: string;
  currentUserId: string;
  authorId: string;
  parentid: string | null;
  isComment?: boolean;
}
function DeleteThread({ threadId, currentUserId, authorId, parentid, isComment }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  if (currentUserId! == authorId || pathname === "/") return null;

  return (
    <Image
      src="/assets/delete.svg"
      alt="delte"
      width={18}
      height={18}
      className="cursor-pointer object-contain"
      onClick={async () => {
        await deleteThread(JSON.parse(threadId), pathname);
        if (!parentid || !isComment) {
          router.push("/");
        }
      }}
    />
  );
}

export default DeleteThread;
