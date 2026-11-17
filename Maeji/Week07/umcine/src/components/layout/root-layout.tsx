import { Outlet, useRouterState } from "@tanstack/react-router";
import { Header } from "./header";

// 이 페이지들은 AuthLayout의 헤더를 사용해요.
const AUTH_PATHS = ["/signup", "/login", "/my-page"];

export function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (AUTH_PATHS.includes(pathname)) {
    return <Outlet />;
  }

  return (
    <div className="min-h-dvh min-w-80 bg-[#111] font-sans text-white">
      <Header />
      <Outlet />
      <footer className="border-t border-[#333] px-6 py-8 text-center text-sm text-[#888]">
        <img
          className="mx-auto mb-3 h-4"
          src="/images/logos/tmdb-logo.svg"
          alt="TMDB 로고"
        />
        <p>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </footer>
    </div>
  );
}
