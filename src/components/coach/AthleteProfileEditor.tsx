"use client";
import { Athlete, AthleteProfile } from "@/types";
import { AthleteStammdatenForm } from "@/components/athlete/AthleteStammdatenForm";

interface Props {
  athlete: Athlete;
  onSave: (updates: Partial<Athlete>) => void;
  onSaveProfile?: (profile: AthleteProfile) => void;
}

export function AthleteProfileEditor({ athlete, onSave, onSaveProfile }: Props) {
  return <AthleteStammdatenForm athlete={athlete} mode="coach" onSave={onSave} onSaveProfile={onSaveProfile} />;
}
