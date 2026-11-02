import { Link } from "@tanstack/react-router";
import type { TmdbMovieListItem } from "../../api/movies/models";
import { getTmdbPosterUrl } from "../../utils/movies/tmdb-image";
import { BookmarkButton } from "../bookmark-button";

interface MovieCardProps {
  movie: TmdbMovieListItem;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const detailParams = {
    movieId: String(movie.id),
  };

  const posterUrl = getTmdbPosterUrl(movie.poster_path);

  return (
    <article className="min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#252525]">
        <Link
          className="block size-full"
          to="/movies/$movieId"
          params={detailParams}
          aria-label={`${movie.title} 상세 보기`}
        >
          {posterUrl ? (
            <img
              className="block size-full object-cover"
              src={posterUrl}
              alt={`${movie.title} 포스터`}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-[#aaa]">
              이미지 없음
            </div>
          )}
        </Link>

        <BookmarkButton
          movieId={movie.id}
          movieTitle={movie.title}
          className="absolute right-2.5 top-2.5"
        />
      </div>

      <h2 className="mb-1.5 mt-3 text-base font-bold leading-[1.4]">
        <Link
          className="text-inherit no-underline hover:underline"
          to="/movies/$movieId"
          params={detailParams}
        >
          {movie.title}
        </Link>
      </h2>

      <p className="m-0 text-sm text-[#aaa]">{movie.release_date}</p>
    </article>
  );
}
