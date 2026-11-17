import { useBookmarkStore } from "../stores/bookmark-store";
import { cn } from "../utils/cn";

interface BookmarkButtonProps {
  movieId: number;
  movieTitle?: string;
  className?: string;
}

export function BookmarkButton({
  movieId,
  movieTitle,
  className,
}: BookmarkButtonProps) {
  const isBookmarked = useBookmarkStore((state) =>
    state.bookmarkedMovieIds.includes(movieId),
  );

  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);

  return (
    <button
      className={cn(
        "grid size-9 cursor-pointer place-items-center rounded-full border-0 p-0",
        isBookmarked ? "bg-[#f42b45]" : "bg-black/65",
        className,
      )}
      type="button"
      aria-label={`${movieTitle} ${isBookmarked ? "북마크 해제" : "북마크 추가"}`}
      aria-pressed={isBookmarked}
      onClick={() => toggleBookmark(movieId)}
    >
      <img
        className="size-[22px]"
        src={
          isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"
        }
        alt=""
      />
    </button>
  );
}
