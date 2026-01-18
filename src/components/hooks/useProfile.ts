import { useState, useEffect, useCallback } from "react";
import type { GenerationStatisticsDTO, ProfileDTO, UserPreferencesDTO } from "@/types";
import { toast } from "sonner";

interface ProfileState {
  statistics: GenerationStatisticsDTO | null;
  profile: ProfileDTO | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    statistics: null,
    profile: null,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch statistics
      const statsResponse = await fetch("/api/statistics/generations");
      if (!statsResponse.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const statistics: GenerationStatisticsDTO = await statsResponse.json();

      setState((prev) => ({
        ...prev,
        statistics,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updatePreferences = useCallback(async (preferences: UserPreferencesDTO): Promise<boolean> => {
    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      toast.success("Preferences saved");
      setState((prev) => ({ ...prev, isSaving: false }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
      setState((prev) => ({ ...prev, isSaving: false }));
      return false;
    }
  }, []);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success("Account deleted");
      window.location.href = "/";
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
      return false;
    }
  }, []);

  return {
    state,
    updatePreferences,
    deleteAccount,
    refetch: fetchData,
  };
}
