import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { BookmarkButton } from "../../components/bookmark-button";
import { getMovieDetail } from "../../api/movies/get-movie-detail";
import type { TmdbMovieDetail } from "../../api/movies/models";
import {
  getTmdbBackdropUrl,
  getTmdbPosterUrl,
} from "../../utils/movies/tmdb-image";
import { getMovieDetailErrorMessage } from "../../utils/movies/get-movie-detail-error-message";
import { formatRuntime } from "../../utils/movies/format-runtime";

function DetailMessage({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-[1200px] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">{message}</h1>

      <Link
        className="mt-6 rounded-lg bg-[#f42b45] px-5 py-3 font-bold text-white no-underline hover:bg-[#d9233b]"
        to="/"
      >
        영화 목록으로 돌아가기
      </Link>
    </main>
  );
}

interface MovieDetailContentProps {
  movie: TmdbMovieDetail;
}

function MovieDetailContent({ movie }: MovieDetailContentProps) {
  const backdropUrl = getTmdbBackdropUrl(movie.backdrop_path);
  const posterUrl = getTmdbPosterUrl(movie.poster_path);
  const genreText = movie.genres.map((genre) => genre.name).join(", ");

  return (
    <main className="pb-20">
      <section className="relative min-h-[360px] overflow-hidden md:min-h-[460px]">
        {backdropUrl ? (
          <img
            className="absolute inset-0 size-full object-cover"
            src={backdropUrl}
            alt=""
            aria-hidden="true"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#252525] text-[#aaa]">
            이미지 없음
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-[#111] via-black/55 to-black/20" />

        <div className="relative mx-auto flex min-h-[360px] max-w-[1200px] items-end px-6 pb-10 md:min-h-[460px]">
          <Link
            className="rounded-lg bg-black/60 px-4 py-2 text-white no-underline backdrop-blur hover:bg-black/80"
            to="/"
          >
            ← 영화 목록
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-8 px-6 py-10 md:grid-cols-[240px_1fr]">
        {posterUrl ? (
          <img
            className="w-full rounded-xl object-cover shadow-2xl"
            src={posterUrl}
            alt={`${movie.title} 포스터`}
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-[#252525] text-[#aaa]">
            이미지 없음
          </div>
        )}

        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold md:text-5xl">
              {movie.title}
            </h1>

            <BookmarkButton
              className="shrink-0"
              movieId={movie.id}
              movieTitle={movie.title}
            />
          </div>

          <p className="mt-3 text-lg text-[#aaa]">{movie.original_title}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#ccc]">
            <span>{movie.release_date}</span>
            <span aria-hidden="true">·</span>
            <span>{formatRuntime(movie.runtime)}</span>
          </div>

          {genreText && <p className="mt-5 text-sm text-[#ddd]">{genreText}</p>}

          {movie.tagline && (
            <h2 className="mt-10 text-2xl font-bold">{movie.tagline}</h2>
          )}

          <p className="mt-4 max-w-3xl text-base leading-8 text-[#ddd]">
            {movie.overview}
          </p>
        </div>
      </section>
    </main>
  );
}

export function MovieDetailPage() {
  const { movieId: movieIdParam } = useParams({
    from: "/movies/$movieId",
  });

  const movieId = Number(movieIdParam);

  const isValidMovieId = Number.isInteger(movieId) && movieId > 0;

  const movieDetailQuery = useQuery({
    queryKey: ["movies", "detail", movieId],
    queryFn: () => getMovieDetail(movieId),
    enabled: isValidMovieId,
    staleTime: 30 * 1000,
  });

  if (!isValidMovieId) {
    return <DetailMessage message="올바르지 않은 영화 번호예요." />;
  }

  if (movieDetailQuery.isPending) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-[1200px] items-center justify-center px-6">
        <p className="text-[#aaa]">영화 상세 정보를 불러오는 중이에요.</p>
      </main>
    );
  }

  if (movieDetailQuery.isError) {
    return (
      <DetailMessage
        message={getMovieDetailErrorMessage(movieDetailQuery.error)}
      />
    );
  }

  return <MovieDetailContent movie={movieDetailQuery.data} />;
}
