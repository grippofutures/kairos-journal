import { AnimatedMark } from "@/components/AnimatedMark";

/**
 * Next.js automatic loading boundary. Renders during navigation while
 * server-side data resolves. Single component shared across all routes.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <AnimatedMark size={88} />
      <p className="mt-8 eyebrow-muted text-[11px]">Loading the read…</p>
    </div>
  );
}
