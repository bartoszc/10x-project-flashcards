import React from "react";
import { useProfile } from "@/components/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";

interface ProfileViewProps {
  userEmail: string;
}

/**
 * Statistics card component.
 */
const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string }> = ({
  title,
  value,
  subtitle,
}) => (
  <div className="p-4 bg-muted rounded-lg text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{title}</p>
    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

/**
 * Profile page main component.
 */
export const ProfileView: React.FC<ProfileViewProps> = ({ userEmail }) => {
  const { state, deleteAccount } = useProfile();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Toaster richColors position="top-right" />
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const stats = state.statistics;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold">Mój profil</h1>
        <p className="text-muted-foreground">{userEmail}</p>
      </header>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statystyki generowania</CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-6">
              {/* Main stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Sesje generowania" value={stats.total_sessions} />
                <StatCard title="Wygenerowane" value={stats.total_generated} />
                <StatCard title="Zaakceptowane" value={stats.total_accepted} subtitle={`${stats.acceptance_rate}%`} />
                <StatCard title="Odrzucone" value={stats.total_rejected} />
              </div>

              {/* Source breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fiszki AI</span>
                    <span className="text-2xl font-bold">{stats.flashcards_by_source.ai}</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${stats.ai_usage_percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stats.ai_usage_percentage}% wszystkich fiszek</p>
                </div>
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fiszki ręczne</span>
                    <span className="text-2xl font-bold">{stats.flashcards_by_source.manual}</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${100 - stats.ai_usage_percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(100 - stats.ai_usage_percentage).toFixed(1)}% wszystkich fiszek
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Brak danych statystycznych</p>
          )}
        </CardContent>
      </Card>

      {/* Account management */}
      <Card>
        <CardHeader>
          <CardTitle>Zarządzanie kontem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane zostaną trwale usunięte.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Usuń konto</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ta operacja jest nieodwracalna. Wszystkie Twoje fiszki, sesje nauki i dane zostaną trwale usunięte.
                  Nie będzie możliwości odzyskania danych.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Usuwanie..." : "Tak, usuń konto"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

ProfileView.displayName = "ProfileView";
