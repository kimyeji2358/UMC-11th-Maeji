import { Link, useParams } from "@tanstack/react-router";
import { BookmarkButton } from "../../components/bookmark-button";
import { movies } from "../../data/movies";

export function MovieDetailPage() {
  const { movieId } = useParams({ from: "/movies/$movieId" });
  const movie = movies.find((item) => item.id === Number(movieId));

  if (!movie) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-[1200px] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold">영화를 찾을 수 없어요.</h1>
        <Link
          className="mt-6 rounded-lg bg-[#f42b45] px-5 py-3 font-bold text-white no-underline hover:bg-[#d9233b]"
          to="/"
        >
          영화 목록으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="pb-20">
      <section className="relative min-h-[360px] overflow-hidden md:min-h-[460px]">
        <img
          className="absolute inset-0 size-full object-cover"
          src={movie.backdropPath}
          alt=""
          aria-hidden="true"
        />
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
        <img
          className="w-full rounded-xl object-cover shadow-2xl"
          src={movie.posterPath}
          alt={`${movie.title} 포스터`}
        />

        <div>
          {/* 새로 추가: 제목과 북마크 버튼을 한 줄에 */}
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

          <p className="mt-3 text-lg text-[#aaa]">{movie.originalTitle}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#ccc]">
            <span>{movie.releaseDate}</span>
            <span aria-hidden="true">·</span>
            <span>{movie.runtime}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-[#2a2a2a] px-3 py-1 text-sm text-[#ddd]"
              >
                {genre}
              </span>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold">{movie.tagline}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#ddd]">
            {movie.overview}
          </p>
        </div>
      </section>
    </main>
  );
}
