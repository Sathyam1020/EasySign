import { useSession } from "@/lib/auth-client";
import { useMemo } from "react";

export function useUser() {
  const { data: session } = useSession();

  const user = useMemo(() => {
    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name || "",
      email: session.user.email || "",
      image: session.user.image || null,
    };
  }, [session?.user]);

  return {
    user,
    isLoading: !session,
  };
}
