import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/** The interface's voice for "something broke" - states what happened, offers the one useful next step. */
export function ErrorState({ message = "We couldn't load this.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-hairline bg-paper px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ember-soft">
        <AlertTriangle className="h-5 w-5 text-ember-red" aria-hidden="true" />
      </div>
      <h3 className="text-h3 text-ink">Something went wrong</h3>
      <p className="mt-1.5 max-w-sm text-body text-slate-mid">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
