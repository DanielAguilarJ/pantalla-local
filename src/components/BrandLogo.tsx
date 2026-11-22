import { BRAND } from "@/lib/brand";

/** Logotipo de texto como en ultravelozmente.com: "World" + "Brain" en itálica serif. */
export function BrandLogo({ className = "", showSuffix = true }: { className?: string; showSuffix?: boolean }) {
  return (
    <span className={`brand-logo ${className}`} aria-label={BRAND.name}>
      <span className="brand-logo-word">
        {BRAND.logo.regular}
        <i>{BRAND.logo.italic}</i>
      </span>
      {showSuffix ? <span className="brand-logo-suffix">{BRAND.logo.suffix}</span> : null}
    </span>
  );
}
