"use client";
import { Dispatch, SetStateAction } from "react";
import { Athlete, MealPlan, SupplementPlan, TrainingPlan } from "@/types";
import {
  loadAthletes, saveSupplementPlanEntry, saveTrainingPlanEntry, toggleMealPlanActive,
  toggleSupplementPlanActive, toggleTrainingPlanActive, updateAthlete,
} from "@/lib/store";
import { showToast } from "@/components/ui/Toast";

/** Save/delete/toggle handlers for GeneralPlansView, shared by the athlete page and the check-in view. */
export function usePlanHandlers(athlete: Athlete | null, setAthlete: Dispatch<SetStateAction<Athlete | null>>) {
  async function saveMealPlan(plan: MealPlan) {
    const previous = athlete;
    try {
      const currentPlans = athlete!.mealPlans ?? [];
      const exists = currentPlans.some(p => p.id === plan.id);
      const newPlans = exists
        ? currentPlans.map(p => p.id === plan.id ? plan : p)
        : [...currentPlans, plan];
      const updated = await updateAthlete(athlete!.id, { mealPlans: newPlans });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Ernährungsplan gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function deleteMealPlan(planId: string) {
    const previous = athlete;
    const optimisticPlans = (athlete!.mealPlans ?? []).filter(p => p.id !== planId);
    setAthlete((prev) => prev ? { ...prev, mealPlans: optimisticPlans } : prev);
    try {
      const updated = await updateAthlete(athlete!.id, { mealPlans: optimisticPlans });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error");
    }
  }

  async function saveTrainingPlan(plan: TrainingPlan) {
    const previous = athlete;
    try {
      const updated = await saveTrainingPlanEntry(athlete!.id, plan);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Trainingsplan gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function deleteTrainingPlan(planId: string) {
    const previous = athlete;
    const optimisticPlans = (athlete!.trainingPlans ?? []).filter((p) => p.id !== planId);
    const activeWasDeleted = athlete!.trainingPlan?.id === planId;
    const newActivePlan = activeWasDeleted ? (optimisticPlans.find((p) => p.isActive) ?? optimisticPlans[0] ?? null) : athlete!.trainingPlan;
    setAthlete((prev) => prev ? { ...prev, trainingPlans: optimisticPlans, trainingPlan: newActivePlan ?? undefined } : prev);
    try {
      const updated = await updateAthlete(athlete!.id, { trainingPlans: optimisticPlans, trainingPlan: newActivePlan ?? undefined });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Trainingsplan gelöscht.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error");
    }
  }

  async function saveSupplementPlan(plan: SupplementPlan) {
    const previous = athlete;
    try {
      const updated = await saveSupplementPlanEntry(athlete!.id, plan);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Supplement-Plan gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function deleteSupplementPlan(planId: string) {
    const previous = athlete;
    const existing = athlete!.supplementPlans ?? (athlete!.supplementPlan ? [athlete!.supplementPlan] : []);
    const optimisticPlans = existing.filter((p) => p.id !== planId);
    const activeWasDeleted = athlete!.supplementPlan?.id === planId;
    const newActivePlan = activeWasDeleted
      ? (optimisticPlans.find((p) => p.isActive) ?? optimisticPlans[0] ?? null)
      : athlete!.supplementPlan;
    setAthlete((prev) => prev ? { ...prev, supplementPlans: optimisticPlans, supplementPlan: newActivePlan ?? undefined } : prev);
    try {
      const updated = await updateAthlete(athlete!.id, { supplementPlans: optimisticPlans, supplementPlan: newActivePlan ?? undefined });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Supplementplan gelöscht.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error");
    }
  }

  async function handleToggleMealPlanActive(planId: string) {
    const previous = athlete;
    try {
      const updated = await toggleMealPlanActive(athlete!.id, planId);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Umschalten des Plans.", "error");
    }
  }

  async function handleToggleTrainingPlanActive(planId: string) {
    const previous = athlete;
    try {
      const updated = await toggleTrainingPlanActive(athlete!.id, planId);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Umschalten des Plans.", "error");
    }
  }

  async function handleToggleSupplementPlanActive(planId: string) {
    const previous = athlete;
    try {
      const updated = await toggleSupplementPlanActive(athlete!.id, planId);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Umschalten des Plans.", "error");
    }
  }

  return {
    onSaveMealPlan: saveMealPlan,
    onDeleteMealPlan: deleteMealPlan,
    onSaveTrainingPlan: saveTrainingPlan,
    onDeleteTrainingPlan: deleteTrainingPlan,
    onSaveSupplementPlan: saveSupplementPlan,
    onDeleteSupplementPlan: deleteSupplementPlan,
    onToggleMealPlanActive: handleToggleMealPlanActive,
    onToggleTrainingPlanActive: handleToggleTrainingPlanActive,
    onToggleSupplementPlanActive: handleToggleSupplementPlanActive,
    onPlansImported: async () => {
      const found = (await loadAthletes()).find((a) => a.id === athlete!.id);
      if (found) setAthlete(found);
    },
  };
}
