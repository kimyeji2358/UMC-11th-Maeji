import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { BookmarkButton } from "../../components/bookmark-button";
import { movies } from "../../data/movies";

interface SearchFormProps {
  initialQuery: string;
  onSearch: (query: string) => void;
}

function SearchForm({ initialQuery, onSearch }: SearchFormProps) {
  const [inputValue, setInputValue] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(inputValue.trim());
  }

  return (
    <form className="flex gap-3" onSubmit={handleSubmit}>
      <input
        className="min-w-0 flex-1 rounded-lg border border-[#444] bg-[#1b1b1b] px-4 py-3 text-white outline-none placeholder:text-[#777] focus:border-[#f42b45]"
        aria-label="검색어"
        placeholder="영화 제목을 입력하세요"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
      />
      <button
        className="shrink-0 rounded-lg bg-[#f42b45] px-6 py-3 font-bold text-white transition-colors hover:bg-[#d9233b]"
        type="submit"
      >
        검색
      </button>
    </form>
  );
}

export function SearchPage() {
  const { query } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });

  const keyword = query?.trim().toLowerCase() ?? "";
  const results = keyword
    ? movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(keyword) ||
          movie.originalTitle.toLowerCase().includes(keyword),
      )
    : [];

  function handleSearch(nextQuery: string) {
    navigate({ search: nextQuery ? { query: nextQuery } : {} });
  }

  return (
    <main className="mx-auto min-h-[calc(100dvh-72px)] max-w-[1200px] px-6 py-12">
      <h1 className="mb-8 text-[28px] font-bold">영화 검색</h1>

      <SearchForm
        key={query ?? ""}
        initialQuery={query ?? ""}
        onSearch={handleSearch}
      />

      {keyword ? (
        <section className="mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">‘{query}’ 검색 결과</h2>
            <p className="mt-2 text-[#aaa]">영화 {results.length}편</p>
          </div>

          {results.length === 0 ? (
            <p className="py-20 text-center text-[#aaa]">검색 결과가 없어요.</p>
          ) : (
            <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((movie) => (
                <li
                  key={movie.id}
                  className="relative overflow-hidden rounded-xl bg-[#1b1b1b]"
                >
                  <img
                    className="aspect-[2/3] w-full object-cover"
                    src={movie.posterPath}
                    alt={`${movie.title} 포스터`}
                    loading="lazy"
                  />

                  {/* 새로 추가: 포스터 오른쪽 위 북마크 버튼 */}
                  <BookmarkButton
                    className="absolute right-2.5 top-2.5"
                    movieId={movie.id}
                    movieTitle={movie.title}
                  />

                  <div className="p-5">
                    <h3 className="text-xl font-bold">{movie.title}</h3>
                    <p className="mt-1 text-sm text-[#aaa]">
                      {movie.originalTitle}
                    </p>
                    <p className="mt-3 text-sm text-[#aaa]">
                      {movie.releaseDate}
                    </p>
                    <p className="mt-4 leading-7 text-[#ddd]">
                      {movie.overview}
                    </p>
                    <Link
                      className="mt-5 inline-flex rounded-lg bg-[#f42b45] px-4 py-2 font-bold text-white no-underline hover:bg-[#d9233b]"
                      to="/movies/$movieId"
                      params={{ movieId: String(movie.id) }}
                    >
                      상세 보기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="py-20 text-center text-[#aaa]">검색어를 입력해 주세요.</p>
      )}
    </main>
  );
}
