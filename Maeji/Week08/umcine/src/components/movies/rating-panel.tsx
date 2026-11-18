import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  useCreateRatingMutation,
  useDeleteRatingMutation,
  useMyRatingsQuery,
  useUpdateRatingMutation,
} from "../../hooks/use-ratings";
import { useAuthStore } from "../../stores/auth-store";
import { cn } from "../../utils/cn";

const SCORES = [1, 2, 3, 4, 5];
const MAX_COMMENT_LENGTH = 500;
const PANEL_CLASS = "mt-10 rounded-xl bg-[#1b1b1b] p-6";

interface RatingPanelProps {
  movieId: number;
}

export function RatingPanel({ movieId }: RatingPanelProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const ratingsQuery = useMyRatingsQuery();
  const createRatingMutation = useCreateRatingMutation();
  const updateRatingMutation = useUpdateRatingMutation();
  const deleteRatingMutation = useDeleteRatingMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  const myRating = ratingsQuery.data?.find(
    (rating) => rating.movieId === movieId,
  );
  const isPending =
    createRatingMutation.isPending ||
    updateRatingMutation.isPending ||
    deleteRatingMutation.isPending;
  const canSubmit =
    score >= 1 && score <= 5 && comment.length <= MAX_COMMENT_LENGTH;

  function resetForm() {
    setScore(0);
    setComment("");
    setIsEditing(false);
  }

  function handleStartEdit() {
    if (!myRating) return;

    setScore(myRating.score);
    setComment(myRating.comment ?? "");
    setIsEditing(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isPending) return;

    if (myRating) {
      updateRatingMutation.mutate(
        { ratingId: myRating.ratingId, score, comment: comment.trim() },
        { onSuccess: resetForm },
      );
      return;
    }

    createRatingMutation.mutate(
      { movieId, score, comment: comment.trim() },
      { onSuccess: resetForm },
    );
  }

  function handleDelete() {
    if (!myRating || isPending) return;
    if (!confirm("평점을 삭제할까요?")) return;

    deleteRatingMutation.mutate(myRating.ratingId, { onSuccess: resetForm });
  }

  if (!accessToken) {
    return (
      <section className={PANEL_CLASS}>
        <h2 className="text-xl font-bold">내 평점</h2>
        <p className="mt-3 text-sm text-[#aaa]">
          <Link to="/login" className="text-[#f42b45] underline">
            로그인
          </Link>
          하면 평점을 남길 수 있어요.
        </p>
      </section>
    );
  }

  if (ratingsQuery.isLoading) {
    return (
      <section className={PANEL_CLASS}>
        <p className="text-sm text-[#aaa]">평점을 불러오는 중이에요.</p>
      </section>
    );
  }

  if (ratingsQuery.isError) {
    return (
      <section className={PANEL_CLASS}>
        <p className="text-sm text-red-400">평점을 불러오지 못했어요.</p>
      </section>
    );
  }

  if (myRating && !isEditing) {
    return (
      <section className={PANEL_CLASS}>
        <h2 className="text-xl font-bold">내 평점</h2>

        <p className="mt-4 text-2xl" aria-label={`${myRating.score}점`}>
          <span className="text-yellow-400">{"★".repeat(myRating.score)}</span>
          <span className="text-[#555]">{"★".repeat(5 - myRating.score)}</span>
        </p>

        {myRating.comment && (
          <p className="mt-3 text-sm leading-6 text-[#ddd]">
            {myRating.comment}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleStartEdit}
            className="rounded-lg border border-[#555] px-4 py-2 text-sm"
          >
            수정
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="rounded-lg bg-[#333] px-4 py-2 text-sm text-red-400"
          >
            {deleteRatingMutation.isPending ? "삭제 중" : "삭제"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={PANEL_CLASS}>
      <h2 className="text-xl font-bold">
        {myRating ? "평점 수정" : "평점 남기기"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex gap-1" role="radiogroup" aria-label="별점">
          {SCORES.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={score === value}
              aria-label={`${value}점`}
              disabled={isPending}
              onClick={() => setScore(value)}
              className={cn(
                "cursor-pointer text-3xl leading-none",
                value <= score ? "text-yellow-400" : "text-[#555]",
              )}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          aria-label="후기"
          placeholder="후기를 남겨 주세요. (선택, 500자 이하)"
          maxLength={MAX_COMMENT_LENGTH}
          disabled={isPending}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-24 w-full resize-none rounded-lg border border-[#444] bg-[#252525] p-3 text-sm text-white outline-none focus:border-[#f42b45]"
        />

        <div className="flex gap-2">
          {isEditing && (
            <button
              type="button"
              disabled={isPending}
              onClick={resetForm}
              className="rounded-lg border border-[#555] px-4 py-2 text-sm"
            >
              취소
            </button>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="rounded-lg bg-[#f42b45] px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {isPending ? "저장 중" : myRating ? "수정 저장" : "평점 등록"}
          </button>
        </div>
      </form>
    </section>
  );
}
