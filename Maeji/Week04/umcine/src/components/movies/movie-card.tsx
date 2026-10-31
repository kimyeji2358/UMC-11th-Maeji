import { Link } from "@tanstack/react-router";
import type { Movie } from "../../types/movie";
import { BookmarkButton } from "../bookmark-button";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const detailParams = {
    movieId: String(movie.id),
  };

  return (
    <article className="min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#252525]">
        <Link
          className="block size-full"
          to="/movies/$movieId"
          params={detailParams}
          aria-label={`${movie.title} 상세 보기`}
        >
          <img
            className="block size-full object-cover"
            src={movie.posterPath}
            alt={`${movie.title} 포스터`}
          />
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

      <p className="m-0 text-sm text-[#aaa]">{movie.releaseDate}</p>
    </article>
  );
}
