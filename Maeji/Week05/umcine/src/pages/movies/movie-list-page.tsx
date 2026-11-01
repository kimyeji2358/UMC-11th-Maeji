import { useState, useEffect } from "react";
import MovieGrid from "../../components/movies/movie-grid";
import Pagination from "../../components/movies/pagination";
import { getMovies } from "../../api/movies/get-movies";
import type { TmdbMovieListItem } from "../../api/movies/models";

export function MovieListPage() {
  const [movies, setMovies] = useState<TmdbMovieListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMovies() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getMovies({ page: 1 });

        if (!ignore) {
          setMovies(response.results);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("영화 목록을 불러오지 못했어요.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-20 pt-12">
      <h1 className="mb-8 text-[28px] font-bold">영화 목록</h1>

      {isLoading ? (
        <p className="py-20 text-center text-[#aaa]">
          영화 목록을 불러오는 중이에요.
        </p>
      ) : errorMessage ? (
        <p role="alert" className="py-20 text-center text-[#aaa]">
          {errorMessage}
        </p>
      ) : movies.length === 0 ? (
        <p className="py-20 text-center text-[#aaa]">
          조건에 맞는 영화가 없어요.
        </p>
      ) : (
        <>
          <MovieGrid movies={movies} />
          <Pagination />
        </>
      )}
    </main>
  );
}
