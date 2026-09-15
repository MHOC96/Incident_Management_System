"use client";

import { ArrowBigUp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { incidentService } from "@/services/incidents";
import type { IncidentVoteResult } from "@/types";

type IncidentVoteButtonProps = {
  incidentId: number;
  voteCount: number;
  hasUpvoted: boolean;
  onChange: (result: IncidentVoteResult) => void;
  /** When "icon", only the upvote control is shown (count shown elsewhere). */
  display?: "full" | "icon";
};

export function IncidentVoteButton({
  incidentId,
  voteCount,
  hasUpvoted,
  onChange,
  display = "full",
}: IncidentVoteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isStudent = user?.role === "STUDENT";

  async function handleVote() {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isStudent || isSubmitting) return;

    const previous: IncidentVoteResult = {
      vote_count: voteCount,
      user_has_upvoted: hasUpvoted,
    };
    const optimistic: IncidentVoteResult = {
      vote_count: hasUpvoted ? Math.max(0, voteCount - 1) : voteCount + 1,
      user_has_upvoted: !hasUpvoted,
    };

    setError("");
    setIsSubmitting(true);
    onChange(optimistic);

    try {
      onChange(await incidentService.toggleVote(incidentId, !hasUpvoted));
    } catch {
      onChange(previous);
      setError("Vote could not be updated. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const label = hasUpvoted ? "Remove upvote" : "Upvote this incident";

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleVote}
        disabled={isAuthLoading || Boolean(user && !isStudent)}
        aria-busy={isSubmitting}
        aria-label={`${label}. ${voteCount} ${voteCount === 1 ? "vote" : "votes"}`}
        aria-pressed={isStudent ? hasUpvoted : undefined}
        title={user && !isStudent ? "Only students can upvote incidents" : label}
        className={`incident-vote-button ${hasUpvoted ? "is-active" : ""}`}
      >
        <ArrowBigUp
          size={20}
          strokeWidth={1.8}
          fill={hasUpvoted ? "currentColor" : "none"}
          aria-hidden="true"
          className="shrink-0"
        />
        {display === "full" ? (
          <>
            <span>{voteCount}</span>
            <span className="hidden sm:inline">{voteCount === 1 ? "vote" : "votes"}</span>
          </>
        ) : null}
      </button>
      {error ? <p role="alert" className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
