import Image from "next/image";

/** A private photo, served through the authenticated photo route. */
export function Photo({
  id,
  width,
  height,
  alt,
  thumb = false,
  className,
  sizes,
  priority = false,
}: {
  id: string;
  width: number;
  height: number;
  alt: string;
  thumb?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/api/photos/${id}${thumb ? "?size=thumb" : ""}`}
      width={width}
      height={height}
      alt={alt}
      unoptimized
      className={className}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
