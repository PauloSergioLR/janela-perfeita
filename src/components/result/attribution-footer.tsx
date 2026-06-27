import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttributionFooterProps {
  className?: string;
  compact?: boolean;
  disclaimer?: string;
}

const DEFAULT_DISCLAIMER =
  "Recomendação estimada com base em previsão meteorológica; confirme as condições locais antes de sair.";

export function AttributionFooter({
  className,
  compact = false,
  disclaimer,
}: AttributionFooterProps) {
  return (
    <footer
      className={cn(
        "flex flex-col gap-2 border-t border-border text-sm leading-6 text-muted-foreground sm:flex-row sm:items-start sm:justify-between",
        compact ? "pt-2 text-xs leading-5" : "pt-5",
        className,
      )}
    >
      <p>
        Dados meteorológicos por{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="Open-Meteo (abre em nova aba)"
          className="inline-flex items-center gap-1 font-medium text-sky-800 underline-offset-4 hover:underline dark:text-sky-300"
        >
          Open-Meteo
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
        {" "}
        e, quando configurado, por{" "}
        <a
          href="https://api.met.no/"
          target="_blank"
          rel="noreferrer"
          aria-label="MET Norway (abre em nova aba)"
          className="inline-flex items-center gap-1 font-medium text-sky-800 underline-offset-4 hover:underline dark:text-sky-300"
        >
          MET Norway
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
        .
      </p>
      <p className="max-w-3xl sm:text-right">
        {disclaimer ?? DEFAULT_DISCLAIMER}
      </p>
    </footer>
  );
}
