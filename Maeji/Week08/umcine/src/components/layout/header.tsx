import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../api/members/me";
import { useAuthStore } from "../../stores/auth-store";

export function Header() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const meQuery = useQuery({
    queryKey: ["members", "me"],
    queryFn: getMe,
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return (
    <header className="sticky top-0 z-50 border-b border-[#333] bg-[#171717]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6">
        <Link
          className="text-[26px] font-extrabold text-[#f42b45] no-underline"
          to="/"
        >
          UMCine
        </Link>

        <nav className="flex items-center gap-6" aria-label="주요 메뉴">
          <Link
            className="text-base font-medium text-white no-underline transition-colors hover:text-[#f42b45]"
            to="/"
          >
            영화
          </Link>

          <Link
            className="text-base font-medium text-white no-underline transition-colors hover:text-[#f42b45]"
            to="/search"
            search={{}}
          >
            검색
          </Link>

          {!accessToken ? (
            <Link to="/login">로그인</Link>
          ) : meQuery.isLoading ? (
            <span className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
          ) : (
            <Link to="/my-page">마이페이지</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
