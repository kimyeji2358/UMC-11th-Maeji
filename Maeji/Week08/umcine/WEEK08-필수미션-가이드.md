# UMCine 8주차 필수 미션 가이드

> 기준 폴더: `D:\UMC_11th\Maeji\umcine`  
> 이 문서는 **설명용**이에요. 프로젝트 코드는 아무것도 바뀌지 않았어요. 아래 코드를 직접 옮겨 적용하면 돼요.  
> 아래 코드는 별도 복사본에 그대로 적용해서 `vite build`, `tsc -b`, `eslint` 가 모두 통과하는 것까지 확인했어요. (실제 서버 응답·브라우저 동작은 직접 확인해야 해요.)

---

## 0. 필수 미션이 뭔지 쉽게 이해하기

### 미션 ① 로그인 전용 폴더 만들기

지금은 `/my-page`에 로그인하지 않은 사람이 들어와도 페이지 컴포넌트 안에서 `if (!accessToken)`로 직접 막고 있어요.
로그인이 필요한 페이지가 늘어나면(마이페이지, 내 정보 수정, …) **페이지마다 같은 검사를 복사**해야 해요.

그래서 **"로그인한 사람만 들어올 수 있는 방"** 을 하나 만들고, 로그인 전용 페이지를 전부 그 방 안에 넣어요.

```text
src/routes/
└── (protected)/              ← Route Group: 파일 정리용 폴더. URL에 안 나타나요.
    └── _authenticated/       ← Pathless Layout: 이름 앞 "_" → URL에 안 나타나요.
        ├── route.tsx         ← 공통 레이아웃 = "문지기". beforeLoad에서 토큰 검사 후 <Outlet />
        └── my-page/
            ├── index.tsx     ← /my-page
            └── edit.tsx      ← /my-page/edit
```

| 문법 | 뜻 | URL에 영향 |
| --- | --- | --- |
| `(protected)` | **Route Group**. 관련 파일을 한 폴더로 묶기만 해요. | ❌ 없음 |
| `_authenticated` | **Pathless Layout Route**. 하위 라우트를 감싸는 공통 부모예요. | ❌ 없음 |
| `route.tsx` | 그 폴더의 레이아웃 파일. `<Outlet />` 자리에 하위 페이지가 그려져요. | – |
| `my-page/index.tsx` | `/my-page` | `/my-page` |
| `my-page/edit.tsx` | `/my-page/edit` | `/my-page/edit` |

흐름: 사용자가 `/my-page/edit` 접속 → `_authenticated/route.tsx`의 `beforeLoad` 먼저 실행 → 토큰 없으면 `/login`으로 `redirect` → 토큰 있으면 `<Outlet />` 자리에 `edit.tsx`의 페이지가 그려짐.

> 지금 프로젝트에는 "내 정보 수정"이 마이페이지 안에서 `isEditing`으로 토글돼요. 미션에서 "마이페이지와 내 정보 수정처럼"이라고 했으니 **`/my-page/edit`라는 별도 페이지로 분리**해서 두 페이지가 한 레이아웃을 공유하게 만들어요.

### 미션 ② 남은 API 연결하기

지금 북마크 버튼은 **브라우저 localStorage(Zustand `bookmark-store`)** 에만 저장돼요. 다른 기기·브라우저에서는 안 보이죠.
이걸 **서버(UMCine API)** 에 저장하도록 바꾸고, 평점 기능도 새로 붙이는 미션이에요.

| 화면 | API | 종류 | 이번 코드에서 하는 일 |
| --- | --- | --- | --- |
| 마이페이지 | `GET /favorites` | 조회 → `useQuery` | 내 즐겨찾기 목록 표시 |
| 영화 상세 | `GET /favorites/{movieId}` | 조회 → `useQuery` | 북마크 버튼이 칠해질지 결정 |
| 영화 상세 | `POST /favorites` | 변경 → `useMutation` | 즐겨찾기 추가 |
| 영화 상세 | `DELETE /favorites/{movieId}` | 변경 → `useMutation` | 즐겨찾기 해제 |
| 영화 상세 | `GET /members/{memberId}/ratings` | 조회 → `useQuery` | 내 평점 목록에서 이 영화 평점 찾기 |
| 영화 상세 | `POST /ratings` | 변경 → `useMutation` | 평점 등록 |
| 영화 상세 | `PATCH /ratings/{ratingId}` | 변경 → `useMutation` | 평점 수정 |
| 영화 상세 | `DELETE /ratings/{ratingId}` | 변경 → `useMutation` | 평점 삭제 |

핵심 원리는 워크북에서 배운 그대로예요.

- **GET** 은 `useQuery` + query key 로 캐시에 저장해요.
- **POST / PATCH / DELETE** 는 `useMutation` 으로 보내고, 성공하면 `invalidateQueries` 로 관련 조회를 "오래됨" 처리 → 화면이 자동으로 다시 조회해서 최신 값으로 바뀌어요.
- query key 를 `["favorites", ...]`, `["ratings", ...]` 처럼 **앞부분을 공통으로** 만들어 두면 `invalidateQueries({ queryKey: ["favorites"] })` 한 번으로 목록·영화별 상태를 **모두** 갱신할 수 있어요(접두사 매칭).

ID 세 가지를 헷갈리지 마세요.

| 이름 | 어디서 얻나 | 어디에 쓰나 |
| --- | --- | --- |
| `movieId` | TMDB 영화 번호 (URL `/movies/550`) | 즐겨찾기 전부, 평점 등록 본문 |
| `memberId` | **로그인 토큰(JWT)의 `sub`** (7주차 백엔드가 `sub: String(member.memberId)`로 서명) | `GET /members/{memberId}/ratings` |
| `ratingId` | 평점 목록 응답의 각 항목 | 평점 수정·삭제 URL |

> ⚠️ **응답 모양은 반드시 API 문서(Swagger)로 확인하세요.**
> - 평점 응답(`ratingId, movieId, score, comment`)은 7주차 백엔드 코드와 맞췄어요. 목록이 배열 그대로 오든 `{ result: [...] }`로 오든 둘 다 처리해요.
> - 즐겨찾기 API는 7주차 백엔드에 없어서 **`GET /favorites` → `result: [{ movieId }]`, `GET /favorites/{movieId}` → `result: { isFavorite }`** 로 가정했어요. 문서의 필드명이 다르면 `src/api/favorites/favorite-api.ts` 의 두 함수만 고치면 돼요.

---

## 1. 수정할 파일 한눈에 보기

| # | 파일 | 작업 | 미션 |
| --- | --- | --- | --- |
| 1 | `src/routes/my-page.tsx` | **삭제** (같은 URL이 2개면 충돌) | ① |
| 2 | `src/routes/(protected)/_authenticated/route.tsx` | 새로 만들기 | ① |
| 3 | `src/components/layout/authenticated-layout.tsx` | 새로 만들기 | ① |
| 4 | `src/routes/(protected)/_authenticated/my-page/index.tsx` | 새로 만들기 | ① |
| 5 | `src/routes/(protected)/_authenticated/my-page/edit.tsx` | 새로 만들기 | ① |
| 6 | `src/hooks/use-me-query.ts` | 새로 만들기 | ① |
| 7 | `src/pages/members/my-page.tsx` | 전체 교체 | ①② |
| 8 | `src/pages/members/edit-my-page.tsx` | 새로 만들기 | ① |
| 9 | `src/components/layout/root-layout.tsx` | 1줄 수정 | ① |
| 10 | `src/api/api-response.ts` | 새로 만들기 | ② |
| 11 | `src/api/favorites/favorite-api.ts` | 새로 만들기 | ② |
| 12 | `src/hooks/use-favorites.ts` | 새로 만들기 | ② |
| 13 | `src/components/bookmark-button.tsx` | 전체 교체 | ② |
| 14 | `src/components/members/favorite-list.tsx` | 새로 만들기 | ② |
| 15 | `src/utils/members/get-member-id.ts` | 새로 만들기 | ② |
| 16 | `src/api/ratings/rating-api.ts` | 새로 만들기 | ② |
| 17 | `src/hooks/use-ratings.ts` | 새로 만들기 | ② |
| 18 | `src/components/movies/rating-panel.tsx` | 새로 만들기 | ② |
| 19 | `src/pages/movies/movie-detail-page.tsx` | import 1줄 + JSX 1줄 추가 | ② |

> `src/routeTree.gen.ts`는 **직접 고치지 마세요.** `pnpm dev`를 켜 두면 라우트 파일을 저장할 때 자동으로 다시 만들어져요. 라우트 파일의 `createFileRoute("...")` 문자열도 플러그인이 알맞게 고쳐 줘요.
> `src/stores/bookmark-store.ts`, `src/utils/bookmark-storage.ts`는 더 이상 쓰지 않아요. 지워도 되고 남겨 둬도 동작엔 문제없어요.

---

# PART A. 주석으로 설명한 전체 코드

> `[새 파일]`, `[추가]`, `[변경]`, `[제거]` 표시를 보면서 읽어요. 기존 파일이라면 무엇이 달라졌는지도 주석에 적었어요.

## 미션 ① 로그인 전용 폴더

### 1. `src/routes/my-page.tsx` — 삭제

```text
[제거] 이 파일을 지워요.
- 아래에서 만드는 (protected)/_authenticated/my-page/index.tsx 도 "/my-page" 주소를 만들어요.
- 같은 주소를 만드는 파일이 두 개면 라우트 생성 시 충돌이 나요.
- 페이지 컴포넌트 src/pages/members/my-page.tsx 는 지우지 않아요! (라우트 파일만 삭제)
```

### 2. `src/routes/(protected)/_authenticated/route.tsx`

```tsx
// [새 파일] 로그인 전용 라우트들의 "공통 레이아웃 라우트"예요.
// - 폴더 (protected)  : Route Group. 파일만 묶고 URL엔 안 나타나요.
// - 폴더 _authenticated: 밑줄로 시작 → Pathless Layout. URL엔 안 나타나고 하위 라우트를 감싸요.
// - 파일 route.tsx     : 그 폴더 자체(= 공통 부모)의 설정 파일이에요.
import { createFileRoute, redirect } from "@tanstack/react-router";
// 실제 화면(<Outlet />)은 별도 컴포넌트 파일로 분리해요.
// 라우트 파일에서 컴포넌트까지 export 하면 eslint(react-refresh) 오류가 나서예요.
import { AuthenticatedLayout } from "../../../components/layout/authenticated-layout";
import { useAuthStore } from "../../../stores/auth-store";

// 문자열은 플러그인이 자동으로 맞춰 줘요. (파일 위치 = 라우트 ID)
export const Route = createFileRoute("/(protected)/_authenticated")({
  // beforeLoad: 하위 페이지(/my-page, /my-page/edit)가 그려지기 "전에" 항상 먼저 실행돼요.
  // login.tsx 에서 배운 beforeLoad 와 반대 방향이에요. (거기선 토큰 있으면 홈으로)
  beforeLoad: () => {
    // React 컴포넌트 밖이라 훅 대신 getState()로 현재 토큰을 읽어요.
    if (!useAuthStore.getState().accessToken) {
      alert("로그인이 필요한 페이지예요.");
      // redirect를 throw 하면 페이지를 그리지 않고 /login 으로 이동해요.
      throw redirect({ to: "/login" });
    }
  },
  // 검사를 통과하면 이 컴포넌트가 그려지고, 그 안의 <Outlet />에 하위 페이지가 들어가요.
  component: AuthenticatedLayout,
});
```

### 3. `src/components/layout/authenticated-layout.tsx`

```tsx
// [새 파일] 로그인 전용 라우트들의 공통 레이아웃 컴포넌트예요.
import { Navigate, Outlet } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth-store";

export function AuthenticatedLayout() {
  // 훅으로 토큰을 "구독"해요. 토큰이 바뀌면 이 컴포넌트가 다시 렌더링돼요.
  const accessToken = useAuthStore((state) => state.accessToken);

  // beforeLoad는 "페이지에 들어올 때" 한 번만 검사해요.
  // 페이지를 보고 있는 도중에 API가 401을 받으면 auth-api.ts가 토큰을 null로 비우는데,
  // 그때도 로그인 페이지로 보내기 위해 여기서 한 번 더 확인해요.
  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  // <Outlet />: 현재 주소에 맞는 하위 페이지(my-page/index 또는 my-page/edit)가 그려지는 자리
  return <Outlet />;
}
```

### 4. `src/routes/(protected)/_authenticated/my-page/index.tsx`

```tsx
// [새 파일] 기존 src/routes/my-page.tsx 를 대신해요. 주소는 똑같이 "/my-page" 예요.
// _authenticated 폴더 안에 있으므로 들어오기 전에 route.tsx의 beforeLoad 검사를 자동으로 거쳐요.
import { createFileRoute } from "@tanstack/react-router";
// 폴더가 3단계 깊어져서 ../ 가 4번이에요.
import { MyPage } from "../../../../pages/members/my-page";

// 끝의 "/"는 index 라우트라는 뜻이에요. (플러그인이 자동으로 맞춰 줘요)
export const Route = createFileRoute("/(protected)/_authenticated/my-page/")({
  component: MyPage,
});
```

### 5. `src/routes/(protected)/_authenticated/my-page/edit.tsx`

```tsx
// [새 파일] "/my-page/edit" 주소의 내 정보 수정 페이지예요.
// 마이페이지와 같은 _authenticated 레이아웃을 공유해요 → 로그인 검사 코드를 또 쓸 필요가 없어요.
import { createFileRoute } from "@tanstack/react-router";
import { EditMyPage } from "../../../../pages/members/edit-my-page";

export const Route = createFileRoute("/(protected)/_authenticated/my-page/edit")(
  {
    component: EditMyPage,
  },
);
```

### 6. `src/hooks/use-me-query.ts`

```ts
// [새 파일] 내 정보 조회 useQuery를 훅으로 묶어요.
// 지금은 header.tsx 와 my-page.tsx 에 같은 useQuery 설정이 복사돼 있어요.
// 마이페이지/수정 페이지 두 곳에서 또 써야 하니 한 곳에 모아요.
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/members/me";
import { useAuthStore } from "../stores/auth-store";

export function useMeQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    // 워크북 2단원과 같은 key. 같은 key를 쓰는 모든 화면이 같은 캐시를 공유해요.
    // → 닉네임 수정 때 setQueryData(["members","me"])를 하면 여기 쓰는 화면도 바로 바뀌어요.
    queryKey: ["members", "me"],
    queryFn: getMe,
    enabled: Boolean(accessToken), // 토큰이 있을 때만 요청
    staleTime: 5 * 60 * 1000, // 내 정보는 자주 안 바뀌니까 5분
    retry: false, // 401이면 재시도하지 않음
  });
}
```

### 7. `src/pages/members/my-page.tsx` — 전체 교체

```tsx
// [변경] 마이페이지를 "조회 전용" 페이지로 바꿔요.
// 이전 → 수정 후
// - [제거] useState, isEditing, 수정 폼, handleSubmit, useUpdateMeMutation
//          → 수정 기능은 /my-page/edit (edit-my-page.tsx) 로 옮겨요.
// - [제거] if (!accessToken) { 로그인해 주세요 } 분기
//          → _authenticated 레이아웃이 대신 검사해 주니 필요 없어요.
// - [변경] 직접 쓰던 useQuery → useMeQuery() 훅
// - [변경] "정보 수정" 버튼 → /my-page/edit 로 가는 Link
// - [추가] 즐겨찾기 목록 <FavoriteList /> (미션 ② GET /favorites)
import { Link } from "@tanstack/react-router";
import { PRIMARY_BUTTON_CLASS } from "../../components/auth/form-styles";
import { AuthLayout } from "../../components/layout/auth-layout";
import { FavoriteList } from "../../components/members/favorite-list"; // [추가]
import { useMeQuery } from "../../hooks/use-me-query"; // [추가]

export function MyPage() {
  const meQuery = useMeQuery(); // [변경] useQuery({...}) → 공통 훅
  const member = meQuery.data;

  // 첫 요청 중일 때
  if (meQuery.isLoading) {
    return (
      <AuthLayout title="내 정보">
        <p role="status">내 정보를 불러오는 중이에요.</p>
      </AuthLayout>
    );
  }

  // 요청 실패 또는 데이터 없음
  if (meQuery.isError || !member) {
    return (
      <AuthLayout title="내 정보">
        <p role="alert">내 정보를 불러오지 못했어요.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="내 정보">
      {/* 기존 조회 화면(dl) 그대로 */}
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

      {/* [변경] onClick={handleStartEdit} 버튼 → 수정 페이지로 이동하는 Link */}
      <Link
        to="/my-page/edit"
        className={`${PRIMARY_BUTTON_CLASS} grid place-items-center`}
      >
        정보 수정
      </Link>

      {/* [추가] 미션 ② GET /favorites 결과 목록 */}
      <FavoriteList />
    </AuthLayout>
  );
}
```

### 8. `src/pages/members/edit-my-page.tsx`

```tsx
// [새 파일] 기존 my-page.tsx 안에 있던 닉네임 수정 폼을 별도 페이지로 옮겨요.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../components/auth/form-styles";
import { AuthLayout } from "../../components/layout/auth-layout";
import { useMeQuery } from "../../hooks/use-me-query";
// 워크북 3단원에서 만든 훅 그대로 사용 (성공 시 setQueryData로 캐시 갱신)
import { useUpdateMeMutation } from "../../hooks/use-update-me-mutation";

export function EditMyPage() {
  const meQuery = useMeQuery();
  const member = meQuery.data;

  if (meQuery.isLoading) {
    return (
      <AuthLayout title="내 정보 수정">
        <p role="status">내 정보를 불러오는 중이에요.</p>
      </AuthLayout>
    );
  }

  if (meQuery.isError || !member) {
    return (
      <AuthLayout title="내 정보 수정">
        <p role="alert">내 정보를 불러오지 못했어요.</p>
      </AuthLayout>
    );
  }

  // 내 정보를 다 불러온 "뒤에" 폼을 그려요.
  // 그래야 useState의 초기값으로 현재 닉네임을 바로 넣을 수 있어요.
  return (
    <AuthLayout title="내 정보 수정">
      <NicknameForm email={member.email} initialNickname={member.nickname} />
    </AuthLayout>
  );
}

interface NicknameFormProps {
  email: string;
  initialNickname: string;
}

function NicknameForm({ email, initialNickname }: NicknameFormProps) {
  const navigate = useNavigate();
  const updateMeMutation = useUpdateMeMutation();
  // 입력 중인 값 = 클라이언트 상태(useState). 서버 값은 query 캐시에 따로 있어요.
  const [form, setForm] = useState({ nickname: initialNickname });

  const nickname = form.nickname.trim();
  const canSubmit = nickname.length >= 2 && nickname.length <= 12;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || updateMeMutation.isPending) return;

    // mutate(입력값, 옵션): 두 번째 인자의 onSuccess는 "이 호출에서만" 실행돼요.
    // 훅 안의 onSuccess(setQueryData + alert)가 먼저 실행되고, 그 다음 이 onSuccess가 실행돼요.
    updateMeMutation.mutate(
      { nickname },
      {
        onSuccess: () => {
          // 캐시가 이미 새 닉네임으로 바뀌었으니 마이페이지로 가면 GET 없이 바로 새 값이 보여요.
          void navigate({ to: "/my-page" });
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="edit-email" className={LABEL_CLASS}>
          이메일
        </label>
        <input
          id="edit-email"
          type="email"
          disabled
          className={INPUT_CLASS}
          value={email}
        />
      </div>

      <div>
        <label htmlFor="edit-nickname" className={LABEL_CLASS}>
          닉네임
        </label>
        <input
          id="edit-nickname"
          type="text"
          autoComplete="nickname"
          placeholder="2~12자"
          className={INPUT_CLASS}
          disabled={updateMeMutation.isPending}
          value={form.nickname}
          onChange={(event) => setForm({ nickname: event.target.value })}
        />

        {!canSubmit && (
          <p className={ERROR_CLASS}>
            닉네임은 2자 이상 12자 이하로 입력해 주세요.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {/* 취소 = 마이페이지로 돌아가기. 저장 안 했으니 캐시는 그대로예요. */}
        <Link
          to="/my-page"
          className="grid h-11 w-full place-items-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          취소
        </Link>

        <button
          type="submit"
          disabled={!canSubmit || updateMeMutation.isPending}
          className={PRIMARY_BUTTON_CLASS}
        >
          {updateMeMutation.isPending ? "저장 중" : "저장"}
        </button>
      </div>
    </form>
  );
}
```

### 9. `src/components/layout/root-layout.tsx` — 1줄 수정

```tsx
import { Outlet, useRouterState } from "@tanstack/react-router";
import { Header } from "./header";

// 이 페이지들은 AuthLayout의 헤더를 사용해요.
// [변경] "/my-page/edit" 추가. 빠뜨리면 수정 페이지에 검은 헤더 + 흰 헤더가 두 번 보여요.
const AUTH_PATHS = ["/signup", "/login", "/my-page", "/my-page/edit"];

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
```

## 미션 ② 남은 API 연결 — 즐겨찾기

### 10. `src/api/api-response.ts`

```ts
// [새 파일] UMCine 서버의 공통 응답 껍데기 타입이에요.
// login.ts, me.ts 에서 매번 isSuccess/code/message/result 를 다시 적었는데,
// 새 API 파일에서는 제네릭 <T> 하나로 재사용해요. (T = result 안에 들어갈 데이터 타입)
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}
```

### 11. `src/api/favorites/favorite-api.ts`

```ts
// [새 파일] 즐겨찾기 API 요청 함수 4개를 모아둔 파일이에요.
// 즐겨찾기는 "내" 데이터라 전부 로그인 토큰이 필요 → apiClient 가 아니라 authApi 사용!
import type { ApiResponse } from "../api-response";
import { authApi } from "../auth-api";

// ⚠️ API 문서의 GET /favorites 응답 항목 모양에 맞게 필드를 추가/수정하세요.
// (favoriteId, createdAt 등이 더 있어도 movieId만 있으면 이 코드는 동작해요)
export interface Favorite {
  movieId: number;
}

// ⚠️ GET /favorites/{movieId} 의 result 모양 (가정). 문서 필드명이 다르면 여기와 아래 return 을 고쳐요.
interface FavoriteStatus {
  isFavorite: boolean;
}

// GET /favorites : 내 즐겨찾기 목록 → 마이페이지
export async function getFavorites(): Promise<Favorite[]> {
  const response = await authApi
    .get("favorites")
    .json<ApiResponse<Favorite[]>>();
  return response.result; // 화면에는 result 안의 배열만 넘겨요 (me.ts 와 같은 방식)
}

// GET /favorites/{movieId} : 이 영화를 즐겨찾기 했는지 → 영화 상세 북마크 버튼
export async function getFavoriteStatus(movieId: number): Promise<boolean> {
  const response = await authApi
    .get(`favorites/${movieId}`)
    .json<ApiResponse<FavoriteStatus>>();
  return response.result.isFavorite;
}

// POST /favorites : 즐겨찾기 추가. 본문에 { movieId } 를 보내요.
// 응답 본문은 쓰지 않으므로 .json() 을 부르지 않아요 → 204 No Content 응답이어도 안전해요.
// (ky 는 4xx/5xx 응답이면 자동으로 에러를 throw → useMutation 의 onError 로 가요)
export async function addFavorite(movieId: number) {
  await authApi.post("favorites", { json: { movieId } });
}

// DELETE /favorites/{movieId} : 즐겨찾기 해제. 영화 번호는 URL에 넣어요.
export async function removeFavorite(movieId: number) {
  await authApi.delete(`favorites/${movieId}`);
}
```

### 12. `src/hooks/use-favorites.ts`

```ts
// [새 파일] 즐겨찾기 조회(useQuery) 2개 + 추가/해제(useMutation) 1개
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFavorite,
  getFavoriteStatus,
  getFavorites,
  removeFavorite,
} from "../api/favorites/favorite-api";
import { useAuthStore } from "../stores/auth-store";

// query key 를 한 곳에서 관리해요. 오타로 key 가 달라지는 실수를 막을 수 있어요.
// 모든 key 가 "favorites" 로 시작 → invalidateQueries({ queryKey: ["favorites"] }) 하나로 전부 무효화 가능
export const favoriteKeys = {
  all: ["favorites"] as const, // ["favorites"]
  list: () => [...favoriteKeys.all, "list"] as const, // ["favorites", "list"]
  status: (movieId: number) => [...favoriteKeys.all, "status", movieId] as const, // ["favorites", "status", 550]
};

// 마이페이지: GET /favorites
export function useFavoritesQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: getFavorites,
    enabled: Boolean(accessToken), // 로그인 전에는 요청 안 함 (헤더의 내 정보 조회와 같은 방식)
    retry: false,
  });
}

// 영화 상세: GET /favorites/{movieId}
export function useFavoriteStatusQuery(movieId: number) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: favoriteKeys.status(movieId), // 영화마다 다른 캐시 칸
    queryFn: () => getFavoriteStatus(movieId),
    enabled: Boolean(accessToken),
    retry: false,
  });
}

// 영화 상세: POST /favorites 또는 DELETE /favorites/{movieId}
export function useToggleFavoriteMutation(movieId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    // mutate(현재 즐겨찾기 여부) 로 호출해요.
    // 이미 즐겨찾기면 해제(DELETE), 아니면 추가(POST)
    mutationFn: (isFavorite: boolean) =>
      isFavorite ? removeFavorite(movieId) : addFavorite(movieId),
    onSuccess: () => {
      // ★ invalidateQueries: "favorites" 로 시작하는 캐시를 모두 오래됨 처리
      //   → 화면에 떠 있는 상세 버튼 상태(status)는 바로 다시 GET
      //   → 마이페이지 목록(list)은 다음에 마이페이지를 열 때 다시 GET
      // POST/DELETE 응답에 최신 목록이 없어서 setQueryData 대신 다시 조회하는 방식을 골랐어요.
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onError: () => {
      alert("즐겨찾기 변경에 실패했어요. 다시 시도해 주세요.");
    },
  });
}
```

### 13. `src/components/bookmark-button.tsx` — 전체 교체

```tsx
// [변경] 북마크 버튼의 "저장 위치"를 브라우저(Zustand bookmark-store) → 서버(즐겨찾기 API)로 바꿔요.
// 이전: useBookmarkStore 로 localStorage 의 id 배열을 읽고, toggleBookmark 로 직접 추가/삭제
// 수정 후: useFavoriteStatusQuery 로 서버에서 상태를 읽고, useToggleFavoriteMutation 으로 서버에 요청
// props(movieId, movieTitle, className)는 그대로라서 movie-card.tsx, movie-detail-page.tsx 는 안 고쳐도 돼요.
import { useNavigate } from "@tanstack/react-router"; // [추가]
import {
  useFavoriteStatusQuery,
  useToggleFavoriteMutation,
} from "../hooks/use-favorites"; // [추가]
import { useAuthStore } from "../stores/auth-store"; // [추가]
// [제거] import { useBookmarkStore } from "../stores/bookmark-store";
import { cn } from "../utils/cn";

interface BookmarkButtonProps {
  movieId: number;
  movieTitle?: string;
  className?: string;
}

export function BookmarkButton({
  movieId,
  movieTitle,
  className,
}: BookmarkButtonProps) {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const favoriteStatusQuery = useFavoriteStatusQuery(movieId); // [추가] GET /favorites/{movieId}
  const toggleFavoriteMutation = useToggleFavoriteMutation(movieId); // [추가] POST / DELETE

  // [변경] 서버 응답이 아직 없으면(로그인 전 포함) false 로 취급
  const isBookmarked = favoriteStatusQuery.data ?? false;
  // 첫 조회 중이거나 요청 중이면 버튼을 잠가서 연타로 요청이 여러 번 가는 걸 막아요.
  const isBusy =
    favoriteStatusQuery.isLoading || toggleFavoriteMutation.isPending;

  function handleClick() {
    // 즐겨찾기 API는 토큰이 필요해요. 로그인 전이면 로그인 페이지로 안내해요.
    if (!accessToken) {
      alert("로그인 후 즐겨찾기를 사용할 수 있어요.");
      void navigate({ to: "/login" });
      return;
    }

    if (isBusy) return;
    // 현재 상태를 넘기면 훅이 추가할지 해제할지 정해요.
    toggleFavoriteMutation.mutate(isBookmarked);
  }

  return (
    <button
      className={cn(
        // [변경] disabled 일 때 흐리게 표시하는 클래스 추가
        "grid size-9 cursor-pointer place-items-center rounded-full border-0 p-0 disabled:cursor-wait disabled:opacity-60",
        isBookmarked ? "bg-[#f42b45]" : "bg-black/65",
        className,
      )}
      type="button"
      aria-label={`${movieTitle} ${isBookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}`}
      aria-pressed={isBookmarked}
      disabled={isBusy} // [추가]
      onClick={handleClick} // [변경] () => toggleBookmark(movieId) → handleClick
    >
      <img
        className="size-[22px]"
        src={
          isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"
        }
        alt=""
      />
    </button>
  );
}
```

> 참고: 이 버튼은 홈의 영화 카드에도 쓰여서, 로그인 상태로 홈을 열면 카드마다 `GET /favorites/{movieId}` 가 한 번씩 나가요. 과제 규모에선 괜찮지만, 줄이고 싶다면 카드에서는 `useFavoritesQuery()` 목록 하나로 `some(f => f.movieId === movieId)` 를 확인하는 방법도 있어요.

### 14. `src/components/members/favorite-list.tsx`

```tsx
// [새 파일] 마이페이지의 "즐겨찾기한 영화" 목록이에요.
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getMovieDetail } from "../../api/movies/get-movie-detail";
import { useFavoritesQuery } from "../../hooks/use-favorites";
import { getTmdbPosterUrl } from "../../utils/movies/tmdb-image";

export function FavoriteList() {
  const favoritesQuery = useFavoritesQuery(); // GET /favorites
  const favorites = favoritesQuery.data ?? [];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold">즐겨찾기한 영화</h2>

      {/* 로딩 → 에러 → 빈 목록 → 목록 순서로 상태를 나눠 보여줘요 */}
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

// 즐겨찾기 응답에는 영화 번호만 있으므로 제목·포스터는 TMDB 에서 가져와요.
function FavoriteItem({ movieId }: { movieId: number }) {
  const movieQuery = useQuery({
    // ★ 영화 상세 페이지(movie-detail-page.tsx)와 "같은 key" 예요.
    //   상세 페이지를 본 영화는 캐시가 있어서 TMDB 요청 없이 바로 보여요. (캐시 공유)
    queryKey: ["movies", "detail", movieId],
    queryFn: () => getMovieDetail(movieId),
    staleTime: 30 * 1000,
  });

  const movie = movieQuery.data;
  const posterUrl = getTmdbPosterUrl(movie?.poster_path ?? null);

  return (
    <li>
      {/* 클릭하면 영화 상세로 이동 */}
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
          {/* TMDB 응답 전에는 영화 번호라도 보여줘요 */}
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
```

## 미션 ② 남은 API 연결 — 평점

### 15. `src/utils/members/get-member-id.ts`

```ts
// [새 파일] 로그인 토큰(JWT)에서 내 회원 번호(memberId)를 꺼내요.
// 왜 필요? GET /members/{memberId}/ratings 는 URL에 회원 번호가 필요한데,
//          GET /members/me 응답(email, nickname, createdAt)에는 memberId 가 없어요.
// 7주차 백엔드 auth.service.ts 가 토큰을 만들 때 sub: String(member.memberId) 로 넣었어요.
// JWT = "헤더.페이로드.서명" → 가운데 페이로드를 Base64URL 디코딩하면 { sub: "12", ... } 가 나와요.
// (여기선 "읽기"만 해요. 토큰이 진짜인지 검증하는 건 서버의 일이에요.)
export function getMemberIdFromToken(accessToken: string | null) {
  if (!accessToken) return null;

  const payload = accessToken.split(".")[1]; // 가운데 부분
  if (!payload) return null;

  try {
    // Base64URL 은 + / 대신 - _ 를 써요. atob 가 읽을 수 있게 바꿔요.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64)) as { sub?: string | number };
    const memberId = Number(claims.sub); // "12" → 12

    // 양의 정수가 아니면 잘못된 값으로 보고 null
    return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
  } catch {
    return null; // 디코딩/파싱 실패
  }
}
```

### 16. `src/api/ratings/rating-api.ts`

```ts
// [새 파일] 평점 API 요청 함수 4개
import { apiClient } from "../api-client";
import type { ApiResponse } from "../api-response";
import { authApi } from "../auth-api";

// 7주차 백엔드 RatingResponseDto 와 같은 모양
export interface Rating {
  ratingId: number; // 수정·삭제 URL 에 쓰는 번호
  movieId: number; // TMDB 영화 번호
  score: number; // 1~5
  comment: string | null; // 후기 (없으면 null)
  createdAt: string;
  updatedAt: string;
}

// POST /ratings 본문 (백엔드 CreateRatingDto)
export interface CreateRatingRequest {
  movieId: number;
  score: number;
  comment: string;
}

// PATCH /ratings/{ratingId} : ratingId 는 URL, 나머지는 본문 (백엔드 UpdateRatingDto)
export interface UpdateRatingRequest {
  ratingId: number;
  score: number;
  comment: string;
}

// GET /members/{memberId}/ratings : 회원의 평점 목록
// 7주차 백엔드에서 "공개 API"(AuthGuard 없음)라서 apiClient 로 요청해요.
export async function getMemberRatings(memberId: number): Promise<Rating[]> {
  const response = await apiClient
    .get(`members/${memberId}/ratings`)
    // 7주차 백엔드는 배열을 그대로 반환하고, 수업 서버는 { result: [...] } 로 감쌀 수도 있어요.
    // 두 경우 모두 처리하려고 타입을 둘 다 적었어요.
    .json<Rating[] | ApiResponse<Rating[]>>();

  return Array.isArray(response) ? response : response.result;
}

// POST /ratings : 평점 등록 (로그인 필요 → authApi)
// 회원 번호는 안 보내요. 서버가 토큰에서 꺼내 써요.
export function createRating(body: CreateRatingRequest) {
  return authApi.post("ratings", { json: body }).json<ApiResponse<Rating>>();
}

// PATCH /ratings/{ratingId} : 평점 수정
// 구조 분해로 ratingId 는 URL 에, 나머지(score, comment)는 body 로 나눠요.
export function updateRating({ ratingId, ...body }: UpdateRatingRequest) {
  return authApi
    .patch(`ratings/${ratingId}`, { json: body })
    .json<ApiResponse<Rating>>();
}

// DELETE /ratings/{ratingId} : 평점 삭제. 응답 본문은 쓰지 않아요.
export async function deleteRating(ratingId: number) {
  await authApi.delete(`ratings/${ratingId}`);
}
```

### 17. `src/hooks/use-ratings.ts`

```ts
// [새 파일] 내 평점 조회(useQuery) 1개 + 등록/수정/삭제(useMutation) 3개
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRating,
  deleteRating,
  getMemberRatings,
  updateRating,
} from "../api/ratings/rating-api";
import { useAuthStore } from "../stores/auth-store";
import { getMemberIdFromToken } from "../utils/members/get-member-id";

// 모든 평점 key 가 "ratings" 로 시작 → invalidateQueries({ queryKey: ["ratings"] }) 로 한 번에 무효화
export const ratingKeys = {
  all: ["ratings"] as const,
  member: (memberId: number | null) =>
    [...ratingKeys.all, "member", memberId] as const, // ["ratings", "member", 12]
};

// GET /members/{memberId}/ratings
export function useMyRatingsQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const memberId = getMemberIdFromToken(accessToken); // 토큰에서 회원 번호 꺼내기

  return useQuery({
    queryKey: ratingKeys.member(memberId),
    // enabled 덕분에 memberId 가 null 이면 실행되지 않으므로 as number 로 단언해도 안전해요.
    queryFn: () => getMemberRatings(memberId as number),
    enabled: memberId !== null, // 로그인 전(회원 번호 없음)에는 요청 안 함
  });
}

// POST /ratings
export function useCreateRatingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRating,
    onSuccess: () => {
      // 등록 성공 → 내 평점 목록을 다시 조회 → 화면이 "등록 폼"에서 "내 평점 보기"로 바뀜
      void queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      alert("평점을 등록했어요.");
    },
    onError: () => {
      alert("평점 등록에 실패했어요. 다시 시도해 주세요.");
    },
  });
}

// PATCH /ratings/{ratingId}
export function useUpdateRatingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRating,
    onSuccess: () => {
      // 수정 성공 → 목록 다시 조회 → 바뀐 별점·후기가 보임
      // (선택 미션: 여기서 setQueryData 로 목록 안의 해당 항목만 바꾸는 방식과 비교해 볼 수 있어요)
      void queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      alert("평점을 수정했어요.");
    },
    onError: () => {
      alert("평점 수정에 실패했어요. 다시 시도해 주세요.");
    },
  });
}

// DELETE /ratings/{ratingId}
export function useDeleteRatingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRating,
    onSuccess: () => {
      // 삭제 성공 → 목록 다시 조회 → 이 영화 평점이 없으니 다시 "평점 등록" 폼이 보임
      void queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      alert("평점을 삭제했어요.");
    },
    onError: () => {
      alert("평점 삭제에 실패했어요. 다시 시도해 주세요.");
    },
  });
}
```

### 18. `src/components/movies/rating-panel.tsx`

```tsx
// [새 파일] 영화 상세의 "내 평점" 영역
// 화면 상태 4가지:
//   ① 로그인 전       → "로그인하면 평점을 남길 수 있어요"
//   ② 평점 없음       → 등록 폼 (POST)
//   ③ 평점 있음       → 별점·후기 보기 + [수정] [삭제] 버튼 (DELETE)
//   ④ 평점 있음+수정중 → 수정 폼 (PATCH)
import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  useCreateRatingMutation,
  useDeleteRatingMutation,
  useMyRatingsQuery,
  useUpdateRatingMutation,
} from "../../hooks/use-ratings";
import { useAuthStore } from "../../stores/auth-store";
import { cn } from "../../utils/cn";

const SCORES = [1, 2, 3, 4, 5];
const MAX_COMMENT_LENGTH = 500; // 백엔드 MaxLength(500)과 맞춤
const PANEL_CLASS = "mt-10 rounded-xl bg-[#1b1b1b] p-6";

interface RatingPanelProps {
  movieId: number;
}

export function RatingPanel({ movieId }: RatingPanelProps) {
  // 훅은 항상 컴포넌트 맨 위에서, 조건문(return)보다 먼저 호출해야 해요.
  const accessToken = useAuthStore((state) => state.accessToken);
  const ratingsQuery = useMyRatingsQuery(); // GET /members/{memberId}/ratings
  const createRatingMutation = useCreateRatingMutation(); // POST
  const updateRatingMutation = useUpdateRatingMutation(); // PATCH
  const deleteRatingMutation = useDeleteRatingMutation(); // DELETE

  // 입력 중인 값 = 클라이언트 상태(useState)
  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(0); // 0 = 아직 별점 안 고름
  const [comment, setComment] = useState("");

  // 내 평점 목록에서 "지금 보고 있는 영화"의 평점을 찾아요. 없으면 undefined.
  const myRating = ratingsQuery.data?.find(
    (rating) => rating.movieId === movieId,
  );
  // 세 mutation 중 하나라도 진행 중이면 버튼을 잠가요.
  const isPending =
    createRatingMutation.isPending ||
    updateRatingMutation.isPending ||
    deleteRatingMutation.isPending;
  const canSubmit =
    score >= 1 && score <= 5 && comment.length <= MAX_COMMENT_LENGTH;

  // 요청 성공 후 입력값 초기화
  function resetForm() {
    setScore(0);
    setComment("");
    setIsEditing(false);
  }

  // [수정] 버튼: 저장된 값을 폼에 채우고 수정 모드로
  function handleStartEdit() {
    if (!myRating) return;

    setScore(myRating.score);
    setComment(myRating.comment ?? "");
    setIsEditing(true);
  }

  // 폼 제출: 평점이 있으면 수정(PATCH), 없으면 등록(POST)
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isPending) return;

    if (myRating) {
      updateRatingMutation.mutate(
        { ratingId: myRating.ratingId, score, comment: comment.trim() },
        { onSuccess: resetForm }, // 이 호출이 성공했을 때만 폼 초기화
      );
      return;
    }

    createRatingMutation.mutate(
      { movieId, score, comment: comment.trim() },
      { onSuccess: resetForm },
    );
  }

  // [삭제] 버튼: 확인 후 DELETE
  function handleDelete() {
    if (!myRating || isPending) return;
    if (!confirm("평점을 삭제할까요?")) return;

    deleteRatingMutation.mutate(myRating.ratingId, { onSuccess: resetForm });
  }

  // ① 로그인 전
  if (!accessToken) {
    return (
      <section className={PANEL_CLASS}>
        <h2 className="text-xl font-bold">내 평점</h2>
        <p className="mt-3 text-sm text-[#aaa]">
          <Link to="/login" className="text-[#f42b45] underline">
            로그인
          </Link>
          하면 평점을 남길 수 있어요.
        </p>
      </section>
    );
  }

  // 평점 목록 첫 조회 중
  if (ratingsQuery.isLoading) {
    return (
      <section className={PANEL_CLASS}>
        <p className="text-sm text-[#aaa]">평점을 불러오는 중이에요.</p>
      </section>
    );
  }

  // 평점 목록 조회 실패
  if (ratingsQuery.isError) {
    return (
      <section className={PANEL_CLASS}>
        <p className="text-sm text-red-400">평점을 불러오지 못했어요.</p>
      </section>
    );
  }

  // ③ 평점 있음 + 보기 모드
  if (myRating && !isEditing) {
    return (
      <section className={PANEL_CLASS}>
        <h2 className="text-xl font-bold">내 평점</h2>

        {/* 채운 별(노랑) + 빈 별(회색) */}
        <p className="mt-4 text-2xl" aria-label={`${myRating.score}점`}>
          <span className="text-yellow-400">{"★".repeat(myRating.score)}</span>
          <span className="text-[#555]">{"★".repeat(5 - myRating.score)}</span>
        </p>

        {myRating.comment && (
          <p className="mt-3 text-sm leading-6 text-[#ddd]">
            {myRating.comment}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleStartEdit}
            className="rounded-lg border border-[#555] px-4 py-2 text-sm"
          >
            수정
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="rounded-lg bg-[#333] px-4 py-2 text-sm text-red-400"
          >
            {deleteRatingMutation.isPending ? "삭제 중" : "삭제"}
          </button>
        </div>
      </section>
    );
  }

  // ② 등록 폼 / ④ 수정 폼 (같은 폼을 같이 써요)
  return (
    <section className={PANEL_CLASS}>
      <h2 className="text-xl font-bold">
        {myRating ? "평점 수정" : "평점 남기기"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* 별 5개 버튼. 누른 별까지 노랗게 칠해져요. */}
        <div className="flex gap-1" role="radiogroup" aria-label="별점">
          {SCORES.map((value) => (
            <button
              key={value}
              type="button" // submit 이 아니라 별점 선택만
              role="radio"
              aria-checked={score === value}
              aria-label={`${value}점`}
              disabled={isPending}
              onClick={() => setScore(value)}
              className={cn(
                "cursor-pointer text-3xl leading-none",
                value <= score ? "text-yellow-400" : "text-[#555]",
              )}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          aria-label="후기"
          placeholder="후기를 남겨 주세요. (선택, 500자 이하)"
          maxLength={MAX_COMMENT_LENGTH}
          disabled={isPending}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-24 w-full resize-none rounded-lg border border-[#444] bg-[#252525] p-3 text-sm text-white outline-none focus:border-[#f42b45]"
        />

        <div className="flex gap-2">
          {/* 수정 모드일 때만 취소 버튼 */}
          {isEditing && (
            <button
              type="button"
              disabled={isPending}
              onClick={resetForm}
              className="rounded-lg border border-[#555] px-4 py-2 text-sm"
            >
              취소
            </button>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="rounded-lg bg-[#f42b45] px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {isPending ? "저장 중" : myRating ? "수정 저장" : "평점 등록"}
          </button>
        </div>
      </form>
    </section>
  );
}
```

### 19. `src/pages/movies/movie-detail-page.tsx` — 2곳 추가

```tsx
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
// BookmarkButton 은 그대로 import. 내부가 서버 즐겨찾기로 바뀌어서 이 파일은 안 고쳐도 돼요.
import { BookmarkButton } from "../../components/bookmark-button";
import { RatingPanel } from "../../components/movies/rating-panel"; // [추가] ①
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

            {/* 즐겨찾기 버튼: GET /favorites/{movieId}, POST /favorites, DELETE /favorites/{movieId} */}
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

          {/* [추가] ② 줄거리 아래에 내 평점 영역 (평점 API 4개) */}
          <RatingPanel movieId={movie.id} />
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
```

---

# PART B. 주석 없는 전체 코드 (그대로 붙여 넣기용)

> `src/routes/my-page.tsx` 는 **삭제**하고, 아래 파일들을 만들거나 내용을 통째로 교체해요.

### 2. `src/routes/(protected)/_authenticated/route.tsx`

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthenticatedLayout } from "../../../components/layout/authenticated-layout";
import { useAuthStore } from "../../../stores/auth-store";

export const Route = createFileRoute("/(protected)/_authenticated")({
  beforeLoad: () => {
    if (!useAuthStore.getState().accessToken) {
      alert("로그인이 필요한 페이지예요.");
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});
```

### 3. `src/components/layout/authenticated-layout.tsx`

```tsx
import { Navigate, Outlet } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth-store";

export function AuthenticatedLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
```

### 4. `src/routes/(protected)/_authenticated/my-page/index.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { MyPage } from "../../../../pages/members/my-page";

export const Route = createFileRoute("/(protected)/_authenticated/my-page/")({
  component: MyPage,
});
```

### 5. `src/routes/(protected)/_authenticated/my-page/edit.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { EditMyPage } from "../../../../pages/members/edit-my-page";

export const Route = createFileRoute("/(protected)/_authenticated/my-page/edit")(
  {
    component: EditMyPage,
  },
);
```

### 6. `src/hooks/use-me-query.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/members/me";
import { useAuthStore } from "../stores/auth-store";

export function useMeQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["members", "me"],
    queryFn: getMe,
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
```

### 7. `src/pages/members/my-page.tsx`

```tsx
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
```

### 8. `src/pages/members/edit-my-page.tsx`

```tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../components/auth/form-styles";
import { AuthLayout } from "../../components/layout/auth-layout";
import { useMeQuery } from "../../hooks/use-me-query";
import { useUpdateMeMutation } from "../../hooks/use-update-me-mutation";

export function EditMyPage() {
  const meQuery = useMeQuery();
  const member = meQuery.data;

  if (meQuery.isLoading) {
    return (
      <AuthLayout title="내 정보 수정">
        <p role="status">내 정보를 불러오는 중이에요.</p>
      </AuthLayout>
    );
  }

  if (meQuery.isError || !member) {
    return (
      <AuthLayout title="내 정보 수정">
        <p role="alert">내 정보를 불러오지 못했어요.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="내 정보 수정">
      <NicknameForm email={member.email} initialNickname={member.nickname} />
    </AuthLayout>
  );
}

interface NicknameFormProps {
  email: string;
  initialNickname: string;
}

function NicknameForm({ email, initialNickname }: NicknameFormProps) {
  const navigate = useNavigate();
  const updateMeMutation = useUpdateMeMutation();
  const [form, setForm] = useState({ nickname: initialNickname });

  const nickname = form.nickname.trim();
  const canSubmit = nickname.length >= 2 && nickname.length <= 12;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || updateMeMutation.isPending) return;

    updateMeMutation.mutate(
      { nickname },
      {
        onSuccess: () => {
          void navigate({ to: "/my-page" });
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="edit-email" className={LABEL_CLASS}>
          이메일
        </label>
        <input
          id="edit-email"
          type="email"
          disabled
          className={INPUT_CLASS}
          value={email}
        />
      </div>

      <div>
        <label htmlFor="edit-nickname" className={LABEL_CLASS}>
          닉네임
        </label>
        <input
          id="edit-nickname"
          type="text"
          autoComplete="nickname"
          placeholder="2~12자"
          className={INPUT_CLASS}
          disabled={updateMeMutation.isPending}
          value={form.nickname}
          onChange={(event) => setForm({ nickname: event.target.value })}
        />

        {!canSubmit && (
          <p className={ERROR_CLASS}>
            닉네임은 2자 이상 12자 이하로 입력해 주세요.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          to="/my-page"
          className="grid h-11 w-full place-items-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          취소
        </Link>

        <button
          type="submit"
          disabled={!canSubmit || updateMeMutation.isPending}
          className={PRIMARY_BUTTON_CLASS}
        >
          {updateMeMutation.isPending ? "저장 중" : "저장"}
        </button>
      </div>
    </form>
  );
}
```

### 9. `src/components/layout/root-layout.tsx`

```tsx
import { Outlet, useRouterState } from "@tanstack/react-router";
import { Header } from "./header";

// 이 페이지들은 AuthLayout의 헤더를 사용해요.
const AUTH_PATHS = ["/signup", "/login", "/my-page", "/my-page/edit"];

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
```

### 10. `src/api/api-response.ts`

```ts
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}
```

### 11. `src/api/favorites/favorite-api.ts`

```ts
import type { ApiResponse } from "../api-response";
import { authApi } from "../auth-api";

export interface Favorite {
  movieId: number;
}

interface FavoriteStatus {
  isFavorite: boolean;
}

export async function getFavorites(): Promise<Favorite[]> {
  const response = await authApi
    .get("favorites")
    .json<ApiResponse<Favorite[]>>();
  return response.result;
}

export async function getFavoriteStatus(movieId: number): Promise<boolean> {
  const response = await authApi
    .get(`favorites/${movieId}`)
    .json<ApiResponse<FavoriteStatus>>();
  return response.result.isFavorite;
}

export async function addFavorite(movieId: number) {
  await authApi.post("favorites", { json: { movieId } });
}

export async function removeFavorite(movieId: number) {
  await authApi.delete(`favorites/${movieId}`);
}
```

### 12. `src/hooks/use-favorites.ts`

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFavorite,
  getFavoriteStatus,
  getFavorites,
  removeFavorite,
} from "../api/favorites/favorite-api";
import { useAuthStore } from "../stores/auth-store";

export const favoriteKeys = {
  all: ["favorites"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
  status: (movieId: number) => [...favoriteKeys.all, "status", movieId] as const,
};

export function useFavoritesQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: getFavorites,
    enabled: Boolean(accessToken),
    retry: false,
  });
}

export function useFavoriteStatusQuery(movieId: number) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: favoriteKeys.status(movieId),
    queryFn: () => getFavoriteStatus(movieId),
    enabled: Boolean(accessToken),
    retry: false,
  });
}

export function useToggleFavoriteMutation(movieId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isFavorite: boolean) =>
      isFavorite ? removeFavorite(movieId) : addFavorite(movieId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onError: () => {
      alert("즐겨찾기 변경에 실패했어요. 다시 시도해 주세요.");
    },
  });
}
```

### 13. `src/components/bookmark-button.tsx`

```tsx
import { useNavigate } from "@tanstack/react-router";
import {
  useFavoriteStatusQuery,
  useToggleFavoriteMutation,
} from "../hooks/use-favorites";
import { useAuthStore } from "../stores/auth-store";
import { cn } from "../utils/cn";

interface BookmarkButtonProps {
  movieId: number;
  movieTitle?: string;
  className?: string;
}

export function BookmarkButton({
  movieId,
  movieTitle,
  className,
}: BookmarkButtonProps) {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const favoriteStatusQuery = useFavoriteStatusQuery(movieId);
  const toggleFavoriteMutation = useToggleFavoriteMutation(movieId);

  const isBookmarked = favoriteStatusQuery.data ?? false;
  const isBusy =
    favoriteStatusQuery.isLoading || toggleFavoriteMutation.isPending;

  function handleClick() {
    if (!accessToken) {
      alert("로그인 후 즐겨찾기를 사용할 수 있어요.");
      void navigate({ to: "/login" });
      return;
    }

    if (isBusy) return;
    toggleFavoriteMutation.mutate(isBookmarked);
  }

  return (
    <button
      className={cn(
        "grid size-9 cursor-pointer place-items-center rounded-full border-0 p-0 disabled:cursor-wait disabled:opacity-60",
        isBookmarked ? "bg-[#f42b45]" : "bg-black/65",
        className,
      )}
      type="button"
      aria-label={`${movieTitle} ${isBookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}`}
      aria-pressed={isBookmarked}
      disabled={isBusy}
      onClick={handleClick}
    >
      <img
        className="size-[22px]"
        src={
          isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"
        }
        alt=""
      />
    </button>
  );
}
```

### 14. `src/components/members/favorite-list.tsx`

```tsx
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
```

### 15. `src/utils/members/get-member-id.ts`

```ts
export function getMemberIdFromToken(accessToken: string | null) {
  if (!accessToken) return null;

  const payload = accessToken.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64)) as { sub?: string | number };
    const memberId = Number(claims.sub);

    return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
  } catch {
    return null;
  }
}
```

### 16. `src/api/ratings/rating-api.ts`

```ts
import { apiClient } from "../api-client";
import type { ApiResponse } from "../api-response";
import { authApi } from "../auth-api";

export interface Rating {
  ratingId: number;
  movieId: number;
  score: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatingRequest {
  movieId: number;
  score: number;
  comment: string;
}

export interface UpdateRatingRequest {
  ratingId: number;
  score: number;
  comment: string;
}

export async function getMemberRatings(memberId: number): Promise<Rating[]> {
  const response = await apiClient
    .get(`members/${memberId}/ratings`)
    .json<Rating[] | ApiResponse<Rating[]>>();

  return Array.isArray(response) ? response : response.result;
}

export function createRating(body: CreateRatingRequest) {
  return authApi.post("ratings", { json: body }).json<ApiResponse<Rating>>();
}

export function updateRating({ ratingId, ...body }: UpdateRatingRequest) {
  return authApi
    .patch(`ratings/${ratingId}`, { json: body })
    .json<ApiResponse<Rating>>();
}

export async function deleteRating(ratingId: number) {
  await authApi.delete(`ratings/${ratingId}`);
}
```

### 17. `src/hooks/use-ratings.ts`

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRating,
  deleteRating,
  getMemberRatings,
  updateRating,
} from "../api/ratings/rating-api";
import { useAuthStore } from "../stores/auth-store";
import { getMemberIdFromToken } from "../utils/members/get-member-id";

export const ratingKeys = {
  all: ["ratings"] as const,
  member: (memberId: number | null) =>
    [...ratingKeys.all, "member", memberId] as const,
};

export function useMyRatingsQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const memberId = getMemberIdFromToken(accessToken);

  return useQuery({
    queryKey: ratingKeys.member(memberId),
    queryFn: () => getMemberRatings(memberId as number),
    enabled: memberId !== null,
  });
}

export function useCreateRatingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRating,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      alert("평점을 등록했어요.");
    },
    onError: () => {
      alert("평점 등록에 실패했어요. 다시 시도해 주세요.");
    },
  });
}

export function useUpdateRatingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRating,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      alert("평점을 수정했어요.");
    },
    onError: () => {
      alert("평점 수정에 실패했어요. 다시 시도해 주세요.");
    },
  });
}

export function useDeleteRatingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRating,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      alert("평점을 삭제했어요.");
    },
    onError: () => {
      alert("평점 삭제에 실패했어요. 다시 시도해 주세요.");
    },
  });
}
```

### 18. `src/components/movies/rating-panel.tsx`

```tsx
import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  useCreateRatingMutation,
  useDeleteRatingMutation,
  useMyRatingsQuery,
  useUpdateRatingMutation,
} from "../../hooks/use-ratings";
import { useAuthStore } from "../../stores/auth-store";
import { cn } from "../../utils/cn";

const SCORES = [1, 2, 3, 4, 5];
const MAX_COMMENT_LENGTH = 500;
const PANEL_CLASS = "mt-10 rounded-xl bg-[#1b1b1b] p-6";

interface RatingPanelProps {
  movieId: number;
}

export function RatingPanel({ movieId }: RatingPanelProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const ratingsQuery = useMyRatingsQuery();
  const createRatingMutation = useCreateRatingMutation();
  const updateRatingMutation = useUpdateRatingMutation();
  const deleteRatingMutation = useDeleteRatingMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  const myRating = ratingsQuery.data?.find(
    (rating) => rating.movieId === movieId,
  );
  const isPending =
    createRatingMutation.isPending ||
    updateRatingMutation.isPending ||
    deleteRatingMutation.isPending;
  const canSubmit =
    score >= 1 && score <= 5 && comment.length <= MAX_COMMENT_LENGTH;

  function resetForm() {
    setScore(0);
    setComment("");
    setIsEditing(false);
  }

  function handleStartEdit() {
    if (!myRating) return;

    setScore(myRating.score);
    setComment(myRating.comment ?? "");
    setIsEditing(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isPending) return;

    if (myRating) {
      updateRatingMutation.mutate(
        { ratingId: myRating.ratingId, score, comment: comment.trim() },
        { onSuccess: resetForm },
      );
      return;
    }

    createRatingMutation.mutate(
      { movieId, score, comment: comment.trim() },
      { onSuccess: resetForm },
    );
  }

  function handleDelete() {
    if (!myRating || isPending) return;
    if (!confirm("평점을 삭제할까요?")) return;

    deleteRatingMutation.mutate(myRating.ratingId, { onSuccess: resetForm });
  }

  if (!accessToken) {
    return (
      <section className={PANEL_CLASS}>
        <h2 className="text-xl font-bold">내 평점</h2>
        <p className="mt-3 text-sm text-[#aaa]">
          <Link to="/login" className="text-[#f42b45] underline">
            로그인
          </Link>
          하면 평점을 남길 수 있어요.
        </p>
      </section>
    );
  }

  if (ratingsQuery.isLoading) {
    return (
      <section className={PANEL_CLASS}>
        <p className="text-sm text-[#aaa]">평점을 불러오는 중이에요.</p>
      </section>
    );
  }

  if (ratingsQuery.isError) {
    return (
      <section className={PANEL_CLASS}>
        <p className="text-sm text-red-400">평점을 불러오지 못했어요.</p>
      </section>
    );
  }

  if (myRating && !isEditing) {
    return (
      <section className={PANEL_CLASS}>
        <h2 className="text-xl font-bold">내 평점</h2>

        <p className="mt-4 text-2xl" aria-label={`${myRating.score}점`}>
          <span className="text-yellow-400">{"★".repeat(myRating.score)}</span>
          <span className="text-[#555]">{"★".repeat(5 - myRating.score)}</span>
        </p>

        {myRating.comment && (
          <p className="mt-3 text-sm leading-6 text-[#ddd]">
            {myRating.comment}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleStartEdit}
            className="rounded-lg border border-[#555] px-4 py-2 text-sm"
          >
            수정
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="rounded-lg bg-[#333] px-4 py-2 text-sm text-red-400"
          >
            {deleteRatingMutation.isPending ? "삭제 중" : "삭제"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={PANEL_CLASS}>
      <h2 className="text-xl font-bold">
        {myRating ? "평점 수정" : "평점 남기기"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex gap-1" role="radiogroup" aria-label="별점">
          {SCORES.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={score === value}
              aria-label={`${value}점`}
              disabled={isPending}
              onClick={() => setScore(value)}
              className={cn(
                "cursor-pointer text-3xl leading-none",
                value <= score ? "text-yellow-400" : "text-[#555]",
              )}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          aria-label="후기"
          placeholder="후기를 남겨 주세요. (선택, 500자 이하)"
          maxLength={MAX_COMMENT_LENGTH}
          disabled={isPending}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-24 w-full resize-none rounded-lg border border-[#444] bg-[#252525] p-3 text-sm text-white outline-none focus:border-[#f42b45]"
        />

        <div className="flex gap-2">
          {isEditing && (
            <button
              type="button"
              disabled={isPending}
              onClick={resetForm}
              className="rounded-lg border border-[#555] px-4 py-2 text-sm"
            >
              취소
            </button>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="rounded-lg bg-[#f42b45] px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {isPending ? "저장 중" : myRating ? "수정 저장" : "평점 등록"}
          </button>
        </div>
      </form>
    </section>
  );
}
```

### 19. `src/pages/movies/movie-detail-page.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { BookmarkButton } from "../../components/bookmark-button";
import { RatingPanel } from "../../components/movies/rating-panel";
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

          <RatingPanel movieId={movie.id} />
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
```


---

# PART C. 적용 후 확인 순서

1. `pnpm dev` 실행 (켜져 있다면 라우트 파일 저장 후 `src/routeTree.gen.ts` 가 자동 갱신됐는지 확인)
2. **UMCine API 서버**(`VITE_API_BASE_URL=http://localhost:3000`)가 켜져 있는지 확인
3. 개발자도구 **Network 탭**(Fetch/XHR 필터)과 **TanStack Query Devtools**(화면 아래 꽃 아이콘)를 열어 두고 아래를 하나씩 확인

| # | 할 일 | 기대 결과 |
| --- | --- | --- |
| 1 | 로그아웃 상태(localStorage 의 `umcine-auth-store` 삭제)로 주소창에 `/my-page` 입력 | "로그인이 필요한 페이지예요." 알림 → `/login` 으로 이동 |
| 2 | 같은 상태로 `/my-page/edit` 입력 | 똑같이 `/login` 으로 이동 (한 레이아웃이 두 페이지를 지킴) |
| 3 | 로그인 후 `/my-page` | 내 정보 + "즐겨찾기한 영화" 목록, Network 에 `GET /favorites` |
| 4 | "정보 수정" 클릭 → 닉네임 변경 → 저장 | `PATCH /members/me` 후 `/my-page` 로 이동, 새 닉네임 표시, **추가 `GET /members/me` 없음** |
| 5 | 영화 상세 진입 | `GET /favorites/{movieId}`, `GET /members/{memberId}/ratings` |
| 6 | 북마크 버튼 클릭 | `POST /favorites` → 이어서 `GET /favorites/{movieId}` 재조회 → 버튼 빨간색 |
| 7 | 다시 클릭 | `DELETE /favorites/{movieId}` → 재조회 → 버튼 원래 색 |
| 8 | 마이페이지로 이동 | `GET /favorites` 재조회되어 방금 변경이 반영됨 |
| 9 | 별 4개 + 후기 → "평점 등록" | `POST /ratings` → `GET /members/{id}/ratings` 재조회 → 보기 모드로 전환 |
| 10 | "수정" → 별 2개 → "수정 저장" | `PATCH /ratings/{ratingId}` → 재조회 → 별 2개 |
| 11 | "삭제" → 확인 | `DELETE /ratings/{ratingId}` → 재조회 → 다시 "평점 남기기" 폼 |

### 잘 안 될 때

| 증상 | 확인할 곳 |
| --- | --- |
| `GET /favorites` 는 200 인데 목록이 비어 보임 | Network 의 Response 탭에서 응답 모양 확인 → `favorite-api.ts` 의 `response.result` 위치/필드명 수정 |
| 북마크 버튼이 항상 빈 아이콘 | `GET /favorites/{movieId}` 응답에서 `isFavorite` 가 아닌 다른 이름을 쓰는지 확인 |
| 평점 영역이 계속 "불러오는 중"이 아니라 아예 요청이 없음 | 토큰의 `sub` 가 숫자인지 확인 (https://jwt.io 에 토큰 붙여넣기). 아니면 `get-member-id.ts` 수정 |
| `Duplicate fullPath` / 라우트 충돌 오류 | `src/routes/my-page.tsx` 를 안 지웠는지 확인 |
| 수정 페이지에 헤더가 두 개 | `root-layout.tsx` 의 `AUTH_PATHS` 에 `"/my-page/edit"` 추가했는지 확인 |
| CORS 오류 | 서버의 `enableCors` 허용 메서드/주소 확인 (7주차 백엔드는 `GET, POST, PATCH, DELETE` 허용) |

---

# PART D. 필수 미션 기록에 쓸 내용

> 워크북 안내대로 **핵심 코드 + 최종 확인 결과만** 적어요. 아래 틀을 노션 "필수 미션" 토글에 옮기고, 📸 표시 위치에 스크린샷을 넣으면 돼요.

## ① 로그인 전용 폴더 만들기

**구조**

```text
src/routes/(protected)/_authenticated/
├── route.tsx          # 공통 레이아웃 라우트 (beforeLoad + Outlet)
└── my-page/
    ├── index.tsx      # /my-page
    └── edit.tsx       # /my-page/edit
```

**설명 (내 말로)**
- `(protected)` 는 Route Group 이라 URL 에 나타나지 않고 파일만 묶는다.
- `_authenticated` 는 Pathless Layout 이라 URL 없이 하위 라우트를 감싼다.
- `route.tsx` 의 `beforeLoad` 가 하위 페이지가 그려지기 전에 토큰을 검사하고, 없으면 `/login` 으로 `redirect` 한다. 통과하면 `<Outlet />` 자리에 하위 페이지가 그려진다.
- 그래서 로그인 전용 페이지가 늘어나도 폴더 안에 파일만 추가하면 된다.

**핵심 코드**: `route.tsx` 의 `beforeLoad` 부분 + `authenticated-layout.tsx` 의 `<Outlet />` 부분

**📸 사진**
1. VS Code 탐색기에서 `src/routes/(protected)/_authenticated` 폴더 구조가 보이는 캡처
2. 로그아웃 상태에서 `/my-page` (또는 `/my-page/edit`) 입력 → "로그인이 필요한 페이지예요." 알림 또는 `/login` 으로 이동한 주소창 캡처
3. 로그인 상태에서 `/my-page` 와 `/my-page/edit` 가 정상으로 열린 캡처

## ② 남은 API 연결하기

**설명 (내 말로)**
- 조회(GET)는 `useQuery`, 변경(POST/PATCH/DELETE)은 `useMutation` 으로 나눴다.
- query key 를 `["favorites", ...]`, `["ratings", ...]` 로 묶어서, 변경에 성공하면 `invalidateQueries` 로 관련 조회를 한 번에 무효화하고 다시 조회하게 했다.
- 즐겨찾기 추가/해제 응답에는 최신 목록이 없어서 `setQueryData` 대신 `invalidateQueries` 를 선택했다. (닉네임 수정은 응답에 최신 정보가 있어서 `setQueryData` 사용)
- `GET /members/{memberId}/ratings` 에 필요한 회원 번호는 `/members/me` 응답에 없어서 JWT 의 `sub` 에서 꺼냈다.

**핵심 코드**
- `use-favorites.ts` 의 `useToggleFavoriteMutation` (`mutationFn` 분기 + `onSuccess` 의 `invalidateQueries`)
- `use-ratings.ts` 의 `useMyRatingsQuery` (`getMemberIdFromToken` + `enabled`)
- `rating-panel.tsx` 의 `handleSubmit` (평점이 있으면 PATCH, 없으면 POST 분기)

**📸 사진**

| # | 화면 | 같이 찍을 것 |
| --- | --- | --- |
| 1 | 마이페이지의 "즐겨찾기한 영화" 목록 | Network 의 `GET /favorites` 200 |
| 2 | 영화 상세에서 북마크 클릭 후 빨간 버튼 | Network 의 `POST /favorites` → `GET /favorites/{movieId}` 순서 |
| 3 | 북마크 해제 후 버튼 | Network 의 `DELETE /favorites/{movieId}` |
| 4 | 평점 등록 후 "내 평점" 보기 화면(별점·후기) | Network 의 `POST /ratings` → `GET /members/{id}/ratings` |
| 5 | 평점 수정 후 바뀐 별점 | Network 의 `PATCH /ratings/{ratingId}` |
| 6 | 평점 삭제 후 다시 나타난 등록 폼 | Network 의 `DELETE /ratings/{ratingId}` |
| 7 | (선택) Query Devtools 에서 `["favorites", ...]`, `["ratings", ...]` key 목록 | – |

> 팁: 2·4번처럼 **변경 요청 바로 뒤에 GET 이 자동으로 한 번 더 나가는 것**이 `invalidateQueries` 가 동작했다는 증거예요. 닉네임 수정(`setQueryData`)은 그 GET 이 **없다**는 게 증거예요. 두 장면을 나란히 캡처해 두면 선택 미션(비교) 기록에도 그대로 쓸 수 있어요.
