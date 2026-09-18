"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotification } from "./notification";

export function NotificationRouteListener() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useNotification();

  useEffect(() => {
    if (searchParams.get("notice") !== "logged-in") return;

    notify({
      type: "success",
      title: "You're logged in",
      message: "Welcome back to Autopayze.",
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("notice");
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams}` : pathname;
    router.replace(nextUrl);
  }, [notify, pathname, router, searchParams]);

  return null;
}