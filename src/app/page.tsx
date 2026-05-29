"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadAuth } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const auth = loadAuth();
    if (auth.role === "coach") router.replace("/coach/dashboard");
    else if (auth.role === "athlete") router.replace("/athlete/dashboard");
    else router.replace("/login");
  }, [router]);
  return null;
}
