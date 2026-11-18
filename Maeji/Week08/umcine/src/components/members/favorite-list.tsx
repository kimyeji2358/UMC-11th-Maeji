import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getMovieDetail } from "../../api/movies/get-movie-detail";
import { useFavoritesQuery } from "../../hooks/use-favorites";
import { getTmdbPosterUrl } from "../../utils/movies/tmdb-image";

export function FavoriteList() {
  const favoritesQuery = useFavoritesQuery();
  const favorites = favoritesQuery.data ?? [];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold">즐겨찾기한 영화</h2>

      {favoritesQuery.isLoading ? (
        <p role="status" className="text-sm text-slate-500">
          즐겨찾기 목록을 불러오는 중이에요.
        </p>
      ) : favoritesQuery.isError ? (
        <p role="alert" className="text-sm text-red-600">
          즐겨찾기 목록을 불러오지 못했어요.
        </p>
      ) : favorites.length === 0 ? (
        <p className="text-sm text-slate-500">아직 즐겨찾기한 영화가 없어요.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {favorites.map((favorite) => (
            <FavoriteItem key={favorite.movieId} movieId={favorite.movieId} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FavoriteItem({ movieId }: { movieId: number }) {
  const movieQuery = useQuery({
    queryKey: ["movies", "detail", movieId],
    queryFn: () => getMovieDetail(movieId),
    staleTime: 30 * 1000,
  });

  const movie = movieQuery.data;
  const posterUrl = getTmdbPosterUrl(movie?.poster_path ?? null);

  return (
    <li>
      <Link
        to="/movies/$movieId"
        params={{ movieId: String(movieId) }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            className="h-16 w-11 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="h-16 w-11 shrink-0 rounded bg-slate-200" />
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {movie?.title ?? `영화 #${movieId}`}
          </p>
          {movie?.release_date && (
            <p className="text-xs text-slate-500">{movie.release_date}</p>
          )}
        </div>
      </Link>
    </li>
  );
}
