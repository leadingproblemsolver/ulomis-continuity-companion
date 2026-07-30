import { Check, HelpCircle, Undo2, X } from "lucide-react";
import { UButton } from "@/components/ulomis/Button";
import { cn } from "@/lib/utils";

export type ThreadControl = "confirm" | "correct" | "dismiss" | "why";

interface ThreadControlsProps {
  onControl: (control: ThreadControl) => void;
  /** Controls currently in an active/toggled state. */
  active?: ThreadControl[];
  confirmed?: boolean;
  className?: string;
}

/**
 * The four controls every restored thread carries. Confirm and Correct are the
 * two that change what Ulomis holds; Why and Dismiss are always available.
 */
export function ThreadControls({
  onControl,
  active = [],
  confirmed = false,
  className,
}: ThreadControlsProps) {
  const isActive = (control: ThreadControl) => active.includes(control);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <UButton
        variant={confirmed ? "quiet" : "primary"}
        size="sm"
        onClick={() => onControl("confirm")}
        aria-pressed={confirmed}
      >
        <Check />
        {confirmed ? "Held" : "Confirm"}
      </UButton>

      <UButton
        variant="outline"
        size="sm"
        onClick={() => onControl("correct")}
        aria-pressed={isActive("correct")}
        aria-expanded={isActive("correct")}
        className={cn(isActive("correct") && "border-correction/50 bg-correction/10")}
      >
        <Undo2 />
        Correct
      </UButton>

      <UButton
        variant="outline"
        size="sm"
        onClick={() => onControl("why")}
        aria-pressed={isActive("why")}
        aria-expanded={isActive("why")}
        className={cn(isActive("why") && "border-primary/50 bg-primary/10")}
      >
        <HelpCircle />
        Why
      </UButton>

      <UButton variant="ghost" size="sm" onClick={() => onControl("dismiss")}>
        <X />
        Dismiss
      </UButton>
    </div>
  );
}
