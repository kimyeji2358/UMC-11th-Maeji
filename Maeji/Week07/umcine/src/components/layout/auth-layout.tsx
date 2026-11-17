import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

function AuthHeader() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2.5" y="2.5" width="19" height="19" rx="4" />
              <path d="M6 11h12v6H6zM6 8h12M8 6l2 2m3-2 2 2" />
            </svg>
            UMCine
          </Link>

          <nav
            aria-label="주 메뉴"
            className="flex items-center gap-4 text-sm font-medium text-slate-600 sm:gap-6"
          >
            <Link to="/" className="hidden hover:text-blue-600 sm:inline">
              영화
            </Link>
            <Link to="/search" className="hidden hover:text-blue-600 sm:inline">
              검색
            </Link>
            <Link
              to="/my-page"
              className="whitespace-nowrap hover:text-blue-600"
            >
              내 정보
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/search"
            aria-label="영화 검색"
            className="hidden size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 sm:flex"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="10.5" cy="10.5" r="5.5" />
              <path d="m15 15 4 4" />
            </svg>
          </Link>

          <Link
            to="/login"
            className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <AuthHeader />

      <main className="grid min-h-[calc(100svh-4rem)] place-items-center px-6 py-12">
        <section className="w-full max-w-[400px]">
          <h1 className="mb-5 text-[30px] font-bold tracking-tight">{title}</h1>
          {children}
        </section>
      </main>
    </div>
  );
}
