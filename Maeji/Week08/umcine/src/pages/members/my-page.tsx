import { Link } from "@tanstack/react-router";
import { PRIMARY_BUTTON_CLASS } from "../../components/auth/form-styles";
import { AuthLayout } from "../../components/layout/auth-layout";
import { FavoriteList } from "../../components/members/favorite-list";
import { useMeQuery } from "../../hooks/use-me-query";

export function MyPage() {
  const meQuery = useMeQuery();
  const member = meQuery.data;

  if (meQuery.isLoading) {
    return (
      <AuthLayout title="내 정보">
        <p role="status">내 정보를 불러오는 중이에요.</p>
      </AuthLayout>
    );
  }

  if (meQuery.isError || !member) {
    return (
      <AuthLayout title="내 정보">
        <p role="alert">내 정보를 불러오지 못했어요.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="내 정보">
      <dl className="mb-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <img src="/icons/mail.svg" alt="" className="size-5 opacity-60" />
          <dt className="w-14 shrink-0 text-sm font-semibold">이메일</dt>
          <dd className="min-w-0 break-all text-sm text-slate-600">
            {member.email}
          </dd>
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5">
          <img src="/icons/person.svg" alt="" className="size-5 opacity-60" />
          <dt className="w-14 shrink-0 text-sm font-semibold">닉네임</dt>
          <dd className="min-w-0 break-all text-sm text-slate-600">
            {member.nickname}
          </dd>
        </div>
      </dl>

      <Link
        to="/my-page/edit"
        className={`${PRIMARY_BUTTON_CLASS} grid place-items-center`}
      >
        정보 수정
      </Link>

      <FavoriteList />
    </AuthLayout>
  );
}
