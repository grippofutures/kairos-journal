"use client";

import { useState } from "react";
import { removeStudent } from "@/app/mentor/actions";

/**
 * Two-step confirmation for removing a student.
 * Step 1: "Remove this student" muted button.
 * Step 2: Reveals a danger panel with an email-confirmation input — submit
 *         button only activates when the typed email exactly matches.
 */
export function RemoveStudentForm({
  studentId,
  studentEmail,
  studentName,
}: {
  studentId: string;
  studentEmail: string;
  studentName: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");

  if (!showConfirm) {
    return (
      <div className="mt-12 pt-8 border-t border-soft">
        <div className="eyebrow-muted mb-3">Danger zone</div>
        <p className="text-sm text-muted-soft mb-3 max-w-xl leading-relaxed">
          If this student has left the mentorship, remove their data here.
          Cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="text-[11px] tracking-eyebrow uppercase text-muted hover:text-gold transition-colors"
        >
          Remove this student permanently →
        </button>
      </div>
    );
  }

  const emailMatches =
    typedEmail.trim().toLowerCase() === studentEmail.toLowerCase();

  return (
    <div className="mt-12 pt-8 border-t border-soft">
      <div className="eyebrow-muted mb-3">Danger zone — remove student</div>
      <p className="text-sm text-bone-dim mb-4 max-w-xl leading-relaxed">
        This will permanently delete <strong className="text-bone">{studentName}</strong>'s
        profile, all of their trades, daily check-ins, screenshots, and any
        mentor notes left on their trades.
      </p>
      <p className="text-xs text-muted-soft mb-5 max-w-xl leading-relaxed">
        Their Discord access is not blocked by this action. If they should never
        come back, remove them from your Kairos Discord server first.
      </p>

      <form action={removeStudent} className="space-y-4 max-w-xl">
        <input type="hidden" name="user_id" value={studentId} />
        <label className="block">
          <span className="block text-sm text-bone-dim mb-2">
            Type <code className="text-gold font-display italic">{studentEmail}</code> below to confirm:
          </span>
          <input
            type="text"
            name="typed_email"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            placeholder={studentEmail}
            autoComplete="off"
            autoFocus
          />
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!emailMatches}
            className="btn-primary"
            style={{
              background: emailMatches ? "#9c4a4a" : undefined,
              opacity: emailMatches ? 1 : 0.5,
            }}
          >
            Remove student permanently
          </button>
          <button
            type="button"
            onClick={() => {
              setShowConfirm(false);
              setTypedEmail("");
            }}
            className="btn-quiet"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
