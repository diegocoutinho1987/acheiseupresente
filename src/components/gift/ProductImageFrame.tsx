import { useEffect, useState, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductImageFrameProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  fallback?: ReactNode;
  children?: ReactNode;
};

export function ProductImageFrame({ src, alt, className, imageClassName, loading = "lazy", fallback, children }: ProductImageFrameProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div className={cn("flex items-center justify-center overflow-hidden bg-muted p-2", className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setFailed(true)}
          className={cn("block max-h-full max-w-full object-contain", imageClassName)}
        />
      ) : (
        fallback ?? <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      )}
      {children}
    </div>
  );
}