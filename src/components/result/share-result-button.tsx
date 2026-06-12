"use client";

import { CheckCircle2, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareResultButtonProps {
  title: string;
  text: string;
}

type ShareFeedback = "shared" | "copied" | "error" | null;

function getFeedbackLabel(feedback: ShareFeedback): string | null {
  if (feedback === "shared") {
    return "Compartilhado";
  }

  if (feedback === "copied") {
    return "Texto copiado";
  }

  if (feedback === "error") {
    return "Não foi possível compartilhar";
  }

  return null;
}

export function ShareResultButton({ title, text }: ShareResultButtonProps) {
  const [feedback, setFeedback] = useState<ShareFeedback>(null);
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);
  const feedbackLabel = getFeedbackLabel(feedback);

  useEffect(() => {
    setCanUseNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  async function handleShare() {
    try {
      if (canUseNativeShare) {
        await navigator.share({ title, text });
        setFeedback("shared");
        return;
      }

      await navigator.clipboard.writeText(text);
      setFeedback("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setFeedback("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md"
        onClick={handleShare}
      >
        {feedback === "copied" || feedback === "shared" ? (
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
        ) : canUseNativeShare ? (
          <Share2 className="size-3.5" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
        Compartilhar
      </Button>
      {feedbackLabel ? (
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {feedbackLabel}
        </span>
      ) : null}
    </div>
  );
}
