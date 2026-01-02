import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props for PasswordInput component.
 * Extends standard input props with visibility toggle callback.
 */
interface PasswordInputProps extends React.ComponentProps<"input"> {
  /** Optional callback when visibility state changes */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Password input field with visibility toggle button.
 * Provides Eye/EyeOff icon to show/hide password content.
 */
function PasswordInput({
  className,
  onVisibilityChange,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const toggleVisibility = React.useCallback(() => {
    setShowPassword((prev) => {
      const newState = !prev;
      onVisibilityChange?.(newState);
      return newState;
    });
  }, [onVisibilityChange]);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={toggleVisibility}
        aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

export { PasswordInput };
export type { PasswordInputProps };
