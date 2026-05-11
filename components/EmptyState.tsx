import { Mark } from "./Brand";

/**
 * Empty-state card with the Kairos mark watermarked behind the message.
 * On-brand: no illustrations, no clipart. Just the mark, very faint.
 */
export function EmptyState({
  title,
  subtitle,
  size = 220,
  className = "",
}: {
  title: string;
  subtitle?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`relative card overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.05 }}
        aria-hidden="true"
      >
        <Mark size={size} />
      </div>
      <div className="relative px-6 py-16 text-center">
        <div className="font-display italic text-bone-dim text-base leading-relaxed">
          {title}
        </div>
        {subtitle && (
          <div className="mt-3 text-[11px] tracking-eyebrow uppercase text-muted">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
