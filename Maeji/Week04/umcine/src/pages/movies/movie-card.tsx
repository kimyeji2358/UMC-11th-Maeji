import { Link } from "@tanstack/react-router";
import type { Movie } from "../../types/movie";
import { BookmarkButton } from "../../components/bookmark-button";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const detailParams = {
    movieId: String(movie.id),
  };

  return (
    <article className="movie-card">
      <div className="poster-wrapper">
        <Link
          className="movie-poster-link"
          to="/movies/$movieId"
          params={detailParams}
          aria-label={`${movie.title} 상세 보기`}
        >
          <img
            className="movie-poster"
            src={movie.posterPath}
            alt={`${movie.title} 포스터`}
          />
        </Link>

        <BookmarkButton
          movieId={movie.id}
          movieTitle={movie.title}
          className="bookmark-button"
        />
      </div>

      <h2 className="movie-title">
        <Link
          className="movie-title-link"
          to="/movies/$movieId"
          params={detailParams}
        >
          {movie.title}
        </Link>
      </h2>

      <p className="movie-date">{movie.releaseDate}</p>
    </article>
  );
}
