"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WeeklyCheckInRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/athlete/checkins");
  }, [router]);
  return null;
}
