import { upsertCheckIn } from "@/app/dashboard/checkin-actions";
import { toggleSkipDay } from "@/app/dashboard/skip-actions";
import { isWeekend } from "@/lib/business-days";

const MOODS = [
  { v: "calm", label: "Calm" },
  { v: "confident", label: "Confident" },
  { v: "hesitant", label: "Hesitant" },
  { v: "rushed", label: "Rushed" },
  { v: "revenge", label: "Revenge" },
  { v: "fomo", label: "FOMO" },
  { v: "blank", label: "Blank" },
] as const;

type CheckIn = {
  pre_market_mood: string | null;
  energy_level: number | null;
  sleep_hours: number | null;
  pre_market_note: string | null;
  post_market_mood: string | null;
  reflection: string | null;
  skipped_day: boolean;
};

export function DailyCheckIn({ today }: { today: CheckIn | null }) {
  const isWeekendToday = isWeekend(new Date());

  // Weekend → friendly notice, no forms
  if (isWeekendToday) {
    return (
      <section className="mb-10">
        <div className="eyebrow mb-3">
          <span className="rule-gold mr-3" />
          Daily check-in
        </div>
        <div className="card p-6 text-center">
          <div className="font-display text-xl text-bone mb-2">
            Markets closed. <em className="text-gold">Rest the read.</em>
          </div>
          <p className="text-sm text-bone-dim font-display italic">
            Weekend. No journal entry expected. The streak holds.
          </p>
        </div>
      </section>
    );
  }

  // Skipped → confirmation + undo
  if (today?.skipped_day) {
    return (
      <section className="mb-10">
        <div className="eyebrow mb-3">
          <span className="rule-gold mr-3" />
          Daily check-in
        </div>
        <div className="card p-6 flex items-center justify-between gap-4">
          <div>
            <div className="font-display text-xl text-bone mb-1">
              Sitting today out. <em className="text-gold">The discipline.</em>
            </div>
            <p className="text-sm text-bone-dim font-display italic">
              Skip days do not break your streak. Come back tomorrow.
            </p>
          </div>
          <form action={toggleSkipDay}>
            <input type="hidden" name="skip" value="false" />
            <button type="submit" className="btn-quiet">
              Undo skip
            </button>
          </form>
        </div>
      </section>
    );
  }

  const preDone = !!today?.pre_market_mood;
  const postDone = !!today?.post_market_mood;

  return (
    <section className="mb-10">
      <div className="eyebrow mb-3 flex items-center justify-between">
        <div>
          <span className="rule-gold mr-3" />
          Daily check-in
        </div>
        <form action={toggleSkipDay}>
          <input type="hidden" name="skip" value="true" />
          <button
            type="submit"
            className="text-[11px] tracking-eyebrow uppercase text-muted hover:text-gold transition-colors"
          >
            Skip today
          </button>
        </form>
      </div>
      <h2 className="font-display text-2xl mb-5">
        How is the day showing up?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-market */}
        <form action={upsertCheckIn} className="card p-6 space-y-4">
          <input type="hidden" name="stage" value="pre" />
          <div className="flex items-baseline justify-between">
            <div className="eyebrow-muted">Pre-market</div>
            {preDone && (
              <span className="text-xs text-gold font-display italic">Saved</span>
            )}
          </div>

          <div>
            <label htmlFor="pre_market_mood" className="block mb-1 text-sm text-bone-dim">
              Mood
            </label>
            <select
              id="pre_market_mood"
              name="pre_market_mood"
              defaultValue={today?.pre_market_mood ?? ""}
            >
              <option value="">— select —</option>
              {MOODS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="energy_level" className="block mb-1 text-sm text-bone-dim">
                Energy 1–5
              </label>
              <input
                id="energy_level"
                type="number"
                name="energy_level"
                min={1}
                max={5}
                defaultValue={today?.energy_level ?? ""}
              />
            </div>
            <div>
              <label htmlFor="sleep_hours" className="block mb-1 text-sm text-bone-dim">
                Sleep hrs
              </label>
              <input
                id="sleep_hours"
                type="number"
                name="sleep_hours"
                min={0}
                max={24}
                step={0.5}
                defaultValue={today?.sleep_hours ?? ""}
              />
            </div>
          </div>

          <div>
            <label htmlFor="pre_market_note" className="block mb-1 text-sm text-bone-dim">
              Pre-market note
            </label>
            <textarea
              id="pre_market_note"
              name="pre_market_note"
              rows={3}
              maxLength={500}
              placeholder="What you're watching for. What's on your mind."
              defaultValue={today?.pre_market_note ?? ""}
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            {preDone ? "Update pre-market" : "Save pre-market"}
          </button>
        </form>

        {/* Post-market */}
        <form action={upsertCheckIn} className="card p-6 space-y-4">
          <input type="hidden" name="stage" value="post" />
          <div className="flex items-baseline justify-between">
            <div className="eyebrow-muted">Post-market</div>
            {postDone && (
              <span className="text-xs text-gold font-display italic">Saved</span>
            )}
          </div>

          <div>
            <label htmlFor="post_market_mood" className="block mb-1 text-sm text-bone-dim">
              Mood at close
            </label>
            <select
              id="post_market_mood"
              name="post_market_mood"
              defaultValue={today?.post_market_mood ?? ""}
            >
              <option value="">— select —</option>
              {MOODS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reflection" className="block mb-1 text-sm text-bone-dim">
              Reflection
            </label>
            <textarea
              id="reflection"
              name="reflection"
              rows={6}
              maxLength={1000}
              placeholder="What worked. What didn't. What you'll change tomorrow."
              defaultValue={today?.reflection ?? ""}
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            {postDone ? "Update post-market" : "Save post-market"}
          </button>
        </form>
      </div>
    </section>
  );
}
