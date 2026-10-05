import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/services/storage";

/** Resolves stored image references (private bucket paths or absolute URLs). */
export function ItemImage({
  reference,
  alt,
  className,
}: {
  reference: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUrl(null);
    void resolveImageUrl(reference).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [reference]);

  if (!reference || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <ImageOff className="h-7 w-7 text-muted-foreground" />
      </div>
    );
  }

  if (!url) {
    return <div className={cn("animate-pulse bg-muted", className)} />;
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
