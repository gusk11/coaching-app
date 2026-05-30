"use client";
import { Athlete } from "@/types";
import { AthleteStammdatenForm } from "@/components/athlete/AthleteStammdatenForm";

interface Props {
  athlete: Athlete;
  onSave: (updates: Partial<Athlete>) => void;
}

export function AthleteProfileEditor({ athlete, onSave }: Props) {
  return <AthleteStammdatenForm athlete={athlete} mode="coach" onSave={onSave} />;
}
