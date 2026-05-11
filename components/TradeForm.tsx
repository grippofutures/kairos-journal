"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTrade } from "@/app/dashboard/actions";

export function TradeForm({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [chartPreview, setChartPreview] = useState<string | null>(null);
  const [chartSource, setChartSource] = useState<"file" | "paste" | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Listen globally for paste events. If the clipboard has an image, take it.
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            // Give the pasted blob a real filename
            const ext = file.type.split("/")[1] || "png";
            const named = new File([file], `pasted-${Date.now()}.${ext}`, {
              type: file.type,
            });
            setChartFile(named);
            setChartPreview((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return URL.createObjectURL(named);
            });
            setChartSource("paste");
            e.preventDefault();
          }
          return;
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []);

  // Clean up object URLs
  useEffect(() => () => {
    if (chartPreview) URL.revokeObjectURL(chartPreview);
  }, [chartPreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setChartFile(f);
    setChartPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setChartSource("file");
  }

  function clearChart() {
    setChartFile(null);
    setChartSource(null);
    setChartPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Drop the file input value — chartFile is the source of truth (file or paste)
    fd.delete("screenshot");

    if (!chartFile) {
      setError("A chart is required. Upload a file or paste an image.");
      return;
    }
    const thesis = String(fd.get("thesis") ?? "").trim();
    if (thesis.length < 20) {
      setError("The thesis is required. Walk through your read in at least twenty characters.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = chartFile.name.split(".").pop() || "png";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("screenshots")
      .upload(path, chartFile, { contentType: chartFile.type, upsert: false });
    setUploading(false);

    if (upErr) {
      setError(`Upload failed. ${upErr.message}`);
      return;
    }
    fd.set("screenshot_path", path);

    startTransition(async () => {
      try {
        await createTrade(fd);
        form.reset();
        clearChart();
      } catch (err) {
        setError(err instanceof Error ? err.message : "The trade could not be saved.");
      }
    });
  }

  const nowLocal = new Date().toISOString().slice(0, 16);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="card p-8 mb-10 space-y-10"
    >
      <div>
        <div className="eyebrow mb-3">
          <span className="rule-gold mr-3" />
          Log a trade
        </div>
        <h2 className="font-display text-3xl leading-tight">
          Wait. Then write the read.
        </h2>
        <p className="mt-3 text-bone-dim text-sm leading-relaxed max-w-xl">
          Each entry is a thesis. Be honest — the goal is patterns, not optics.
        </p>
      </div>

      <hr className="hairline" />

      {/* ===================== Section 1: The trade ===================== */}
      <Section number="01" title="The trade">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Date · time">
            <input type="datetime-local" name="traded_at" defaultValue={nowLocal} required />
          </Field>
          <Field label="Instrument">
            <input name="instrument" placeholder="ES · NQ · MNQ · GC" required />
          </Field>
          <Field label="Direction">
            <select name="direction" defaultValue="long" required>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </Field>

          <Field label="Contracts">
            <input type="number" step="1" min="1" name="contracts" required />
          </Field>
          <Field label="P&L">
            <input type="number" step="any" name="pnl" required />
          </Field>
          <Field label="R multiple">
            <input type="number" step="any" name="r_multiple" placeholder="1.5 · −1" />
          </Field>

          <Field label="Outcome">
            <select name="outcome" defaultValue="win" required>
              <option value="win">Won</option>
              <option value="loss">Lost</option>
              <option value="breakeven">Even</option>
            </select>
          </Field>
        </div>

        <label className="flex items-start gap-3 bg-canvas border border-soft rounded-sm p-4 cursor-pointer hover:border-gold transition-colors mt-2">
          <input
            type="checkbox"
            name="followed_model"
            className="mt-1"
            style={{ width: "16px", height: "16px" }}
          />
          <div>
            <div className="font-display text-base">I followed the model on this trade</div>
            <div className="text-xs text-bone-dim mt-1 leading-relaxed">
              Check this only if the entry honored the framework — read, trigger, level, and exit plan.
              This drives your rules-followed streak.
            </div>
          </div>
        </label>
      </Section>

      <hr className="hairline" />

      {/* ===================== Section 2: The thesis ===================== */}
      <Section number="02" title="The thesis">
        <Field label="Walk through your read">
          <textarea
            name="thesis"
            rows={5}
            required
            minLength={20}
            placeholder="What was the candle context. Where had price come from. What earned the entry. Where were TP1 and TP2 marked, before you took the trade."
          />
        </Field>
      </Section>

      <hr className="hairline" />

      {/* ===================== Section 3: The context ===================== */}
      <Section number="03" title="The context">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Setup tag">
            <input name="setup_tag" placeholder="NY AM expansion · Asia reversal" />
          </Field>
          <Field label="Emotion">
            <select name="emotion_tag" defaultValue="">
              <option value="">—</option>
              <option value="calm">Calm</option>
              <option value="confident">Confident</option>
              <option value="hesitant">Hesitant</option>
              <option value="rushed">Rushed</option>
              <option value="revenge">Revenge</option>
              <option value="fomo">FOMO</option>
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea name="notes" rows={2} placeholder="Anything else worth remembering at review." />
        </Field>
      </Section>

      <hr className="hairline" />

      {/* ===================== Section 4: The chart ===================== */}
      <Section number="04" title="The chart">
        <div className="text-xs text-bone-dim font-display italic mb-3 leading-relaxed">
          Required. Upload a file <span className="text-muted">or</span> press{" "}
          <kbd className="text-bone bg-canvas border border-soft px-1.5 py-0.5 rounded-sm not-italic font-ui text-[11px]">
            Ctrl/⌘ + V
          </kbd>{" "}
          anywhere on this page to paste a screenshot from TradingView.
        </div>

        {chartPreview ? (
          <div className="space-y-3">
            <div className="border border-soft bg-canvas overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chartPreview}
                alt="Chart preview"
                className="block max-h-[480px] w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-bone-dim font-display italic">
                {chartSource === "paste" ? "Pasted from clipboard" : "Uploaded"} · {Math.round((chartFile?.size ?? 0) / 1024)} KB
              </span>
              <button
                type="button"
                onClick={clearChart}
                className="btn-quiet"
              >
                Clear chart
              </button>
            </div>
          </div>
        ) : (
          <input
            ref={fileInputRef}
            type="file"
            name="screenshot"
            accept="image/*"
            onChange={handleFileChange}
          />
        )}
      </Section>

      <hr className="hairline" />

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending || uploading}
          className="btn-primary"
        >
          {uploading ? "Uploading…" : pending ? "Saving…" : "Log the trade"}
        </button>
        {error && (
          <span className="text-sm font-display italic text-bone-dim">{error}</span>
        )}
      </div>
    </form>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-6">
      <div className="md:pt-1">
        <div className="font-display text-gold text-2xl italic leading-none">{number}</div>
        <div className="eyebrow-muted mt-2">{title}</div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow-muted block mb-2">{label}</span>
      {children}
    </label>
  );
}
