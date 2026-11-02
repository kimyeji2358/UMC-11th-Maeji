import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MovieGrid from "../../components/movies/movie-grid";
import { getMovies } from "../../api/movies/get-movies";

export function MovieListPage() {
  const [page, setPage] = useState(1);

  const moviesQuery = useQuery({
    queryKey: ["movies", "list", { page }],
    queryFn: () => getMovies({ page }),
  });

  const movies = moviesQuery.data?.results ?? [];
  const totalPages = moviesQuery.data?.total_pages ?? 0;

  const startPage = Math.floor((page - 1) / 5) * 5 + 1;

  const pageNumbers = Array.from(
    { length: 5 },
    (_, index) => startPage + index,
  ).filter((pageNumber) => pageNumber <= totalPages);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-20 pt-12">
      <h1 className="mb-8 text-[28px] font-bold">영화 목록</h1>

      {moviesQuery.isPending ? (
        <p>영화를 불러오는 중이에요.</p>
      ) : moviesQuery.isError ? (
        <p>{moviesQuery.error.message}</p>
      ) : movies.length === 0 ? (
        <p>표시할 영화가 없어요.</p>
      ) : (
        <>
          <MovieGrid movies={movies} />

          <nav
            aria-label="영화 목록 페이지"
            className="mt-10 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              aria-label="이전 페이지"
              className="flex size-9 items-center justify-center rounded text-[#aaa] hover:bg-[#252525] disabled:opacity-30"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ‹
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-label={`${pageNumber}페이지`}
                aria-current={page === pageNumber ? "page" : undefined}
                className={`flex size-9 items-center justify-center rounded text-sm font-bold ${
                  page === pageNumber
                    ? "bg-white text-black"
                    : "text-[#aaa] hover:bg-[#252525]"
                }`}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              aria-label="다음 페이지"
              className="flex size-9 items-center justify-center rounded text-[#aaa] hover:bg-[#252525] disabled:opacity-30"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              ›
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
