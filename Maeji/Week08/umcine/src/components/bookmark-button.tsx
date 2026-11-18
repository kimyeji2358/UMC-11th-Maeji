import { useNavigate } from "@tanstack/react-router";
import {
  useFavoriteStatusQuery,
  useToggleFavoriteMutation,
} from "../hooks/use-favorites";
import { useAuthStore } from "../stores/auth-store";
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
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const favoriteStatusQuery = useFavoriteStatusQuery(movieId);
  const toggleFavoriteMutation = useToggleFavoriteMutation(movieId);

  const isBookmarked = favoriteStatusQuery.data ?? false;
  const isBusy =
    favoriteStatusQuery.isLoading || toggleFavoriteMutation.isPending;

  function handleClick() {
    if (!accessToken) {
      alert("로그인 후 즐겨찾기를 사용할 수 있어요.");
      void navigate({ to: "/login" });
      return;
    }

    if (isBusy) return;
    toggleFavoriteMutation.mutate(isBookmarked);
  }

  return (
    <button
      className={cn(
        "grid size-9 cursor-pointer place-items-center rounded-full border-0 p-0 disabled:cursor-wait disabled:opacity-60",
        isBookmarked ? "bg-[#f42b45]" : "bg-black/65",
        className,
      )}
      type="button"
      aria-label={`${movieTitle} ${isBookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}`}
      aria-pressed={isBookmarked}
      disabled={isBusy}
      onClick={handleClick}
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
