# 필수 미션

## ① 로그인 전용 폴더 만들기

### 무엇을 했는지

원래는 마이페이지 컴포넌트 안에서 `if (!accessToken)`으로 로그인 여부를 직접 검사하고 있었음.
이렇게 하면 로그인이 필요한 페이지가 늘어날 때마다 같은 코드를 페이지마다 복사해야 해서, 로그인 전용 페이지를 한 폴더에 모으고 검사는 공통 레이아웃 한 곳에서만 하도록 바꿨음.

마이페이지 안에서 `isEditing`으로 토글하던 닉네임 수정 폼도 `/my-page/edit` 페이지로 따로 분리했음. 그래서 마이페이지와 내 정보 수정 페이지가 같은 레이아웃을 공유하게 됨.

```text
src/routes/
└── (protected)/                 # Route Group → 파일만 묶고 URL에는 안 나옴
    └── _authenticated/          # Pathless Layout → URL 없이 하위 라우트를 감쌈
        ├── route.tsx            # beforeLoad로 토큰 검사 후 <Outlet />
        └── my-page/
            ├── index.tsx        # /my-page
            └── edit.tsx         # /my-page/edit
```

| 문법 | 역할 | URL에 영향 |
| --- | --- | --- |
| `(protected)` | 관련 라우트 파일을 한 폴더로 묶는 Route Group | 없음 |
| `_authenticated` | 하위 라우트를 감싸는 Pathless Layout Route | 없음 |
| `route.tsx` | 그 폴더 자체의 레이아웃 라우트 설정 파일 | - |

### 핵심 코드

`src/routes/(protected)/_authenticated/route.tsx`

```tsx
export const Route = createFileRoute("/(protected)/_authenticated")({
  // 하위 페이지가 그려지기 전에 항상 먼저 실행됨
  beforeLoad: () => {
    if (!useAuthStore.getState().accessToken) {
      alert("로그인이 필요한 페이지예요.");
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});
```

`src/components/layout/authenticated-layout.tsx`

```tsx
export function AuthenticatedLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);

  // 페이지를 보는 도중 401로 토큰이 지워져도 로그인 페이지로 보냄
  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  // 현재 주소에 맞는 하위 페이지(/my-page, /my-page/edit)가 그려지는 자리
  return <Outlet />;
}
```

- `beforeLoad`는 페이지에 **들어올 때** 한 번 검사함. 페이지를 보는 중에 API가 401을 받아서 토큰이 비워지는 경우는 못 잡기 때문에, 레이아웃 컴포넌트에서 토큰을 구독해서 한 번 더 확인하도록 했음.
- 처음에는 레이아웃 컴포넌트를 `route.tsx` 안에 같이 썼는데, eslint에서 `react-refresh/only-export-components` 오류가 나서 컴포넌트를 별도 파일로 뺐음.
- 같은 `/my-page` 주소를 만드는 기존 `src/routes/my-page.tsx`는 남겨두면 라우트가 충돌하기 때문에 삭제했음.

### 확인 결과

- 로그아웃 상태에서 주소창에 `/my-page`, `/my-page/edit`를 직접 입력하면 알림이 뜨고 `/login`으로 이동함.
- 로그인 상태에서는 두 페이지 모두 정상으로 열림.

📸 (사진) `src/routes/(protected)/_authenticated` 폴더 구조

📸 (사진) 비로그인 상태로 `/my-page` 접속 → `/login`으로 이동한 화면

📸 (사진) 로그인 상태의 마이페이지 / 내 정보 수정 페이지

---

## ② 남은 API 연결하기

### 데이터 흐름 정리

| 화면 | API | 사용한 훅 | 변경 후 반영 |
| --- | --- | --- | --- |
| 마이페이지 | `GET /favorites` | `useFavoritesQuery` | - |
| 영화 상세 | `GET /favorites/{movieId}` | `useFavoriteStatusQuery` | - |
| 영화 상세 | `POST /favorites` | `useToggleFavoriteMutation` | `invalidateQueries(["favorites"])` |
| 영화 상세 | `DELETE /favorites/{movieId}` | `useToggleFavoriteMutation` | `invalidateQueries(["favorites"])` |
| 영화 상세 | `GET /members/{memberId}/ratings` | `useMyRatingsQuery` | - |
| 영화 상세 | `POST /ratings` | `useCreateRatingMutation` | `invalidateQueries(["ratings"])` |
| 영화 상세 | `PATCH /ratings/{ratingId}` | `useUpdateRatingMutation` | `invalidateQueries(["ratings"])` |
| 영화 상세 | `DELETE /ratings/{ratingId}` | `useDeleteRatingMutation` | `invalidateQueries(["ratings"])` |

- 조회(GET)는 `useQuery`, 변경(POST/PATCH/DELETE)은 `useMutation`으로 나눴음.
- 토큰이 필요한 요청은 `authApi`로, 공개 API인 회원 평점 조회는 `apiClient`로 보냈음.
- query key를 `["favorites", ...]`, `["ratings", ...]`처럼 앞부분을 똑같이 맞춰서, 변경에 성공하면 `invalidateQueries` 한 번으로 목록이랑 영화별 상태를 같이 무효화되게 했음.
- 즐겨찾기 추가/해제 응답에는 최신 목록이 안 들어있어서 `setQueryData` 대신 `invalidateQueries`로 다시 조회하는 방식을 골랐음. (닉네임 수정은 응답에 최신 회원 정보가 있어서 `setQueryData`를 씀)
- 북마크 버튼은 원래 Zustand `persist`로 localStorage에만 저장하고 있었는데, 서버 즐겨찾기 API를 쓰도록 바꿨음. props는 그대로 둬서 버튼을 쓰는 영화 카드랑 상세 페이지는 안 고쳐도 됐음.

### 핵심 코드

**즐겨찾기 추가·해제** — `src/hooks/use-favorites.ts`

```ts
export const favoriteKeys = {
  all: ["favorites"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
  status: (movieId: number) => [...favoriteKeys.all, "status", movieId] as const,
};

export function useToggleFavoriteMutation(movieId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    // 지금 즐겨찾기 상태면 해제(DELETE), 아니면 추가(POST)
    mutationFn: (isFavorite: boolean) =>
      isFavorite ? removeFavorite(movieId) : addFavorite(movieId),
    onSuccess: () => {
      // "favorites"로 시작하는 캐시(list, status)를 한 번에 무효화
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onError: () => {
      alert("즐겨찾기 변경에 실패했어요. 다시 시도해 주세요.");
    },
  });
}
```

**내 평점 조회** — `src/hooks/use-ratings.ts`

`GET /members/me` 응답에는 회원 번호가 없어서, 로그인 토큰(JWT)의 `sub`에 들어있는 회원 번호를 꺼내서 썼음. (백엔드에서 토큰 만들 때 `sub`에 memberId를 넣어둔 걸 이용함)

```ts
export function useMyRatingsQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const memberId = getMemberIdFromToken(accessToken); // JWT의 sub → 회원 번호

  return useQuery({
    queryKey: ratingKeys.member(memberId),
    queryFn: () => getMemberRatings(memberId as number),
    enabled: memberId !== null, // 로그인 전에는 요청 안 보냄
  });
}
```

**평점 등록·수정 분기** — `src/components/movies/rating-panel.tsx`

내 평점 목록에서 지금 보고 있는 영화의 평점을 찾아서, 있으면 수정(PATCH), 없으면 등록(POST)하게 했음.

```tsx
const myRating = ratingsQuery.data?.find((rating) => rating.movieId === movieId);

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
```

### 확인 결과

- 영화 상세에서 북마크를 누르면 `POST /favorites`(201) 다음에 `GET /favorites/{movieId}`가 자동으로 한 번 더 나가고, 버튼이 채워진 상태로 바뀜.
- 한 번 더 누르면 `DELETE /favorites/{movieId}`(200) 다음에 다시 조회가 나가고, 버튼이 원래대로 돌아옴.
- 마이페이지에 들어가면 `GET /favorites`로 즐겨찾기한 영화 목록이 보임.
- 평점 등록 → `POST /ratings` 후 `GET /members/{memberId}/ratings`가 다시 나가고 보기 화면으로 바뀜.
- 평점 수정 → `PATCH /ratings/{ratingId}` 후 바뀐 별점이 보임.
- 평점 삭제 → `DELETE /ratings/{ratingId}` 후 다시 등록 폼이 보임.

📸 (사진) 마이페이지 즐겨찾기 목록 + Network `GET /favorites`

📸 (사진) 즐겨찾기 추가 후 버튼 + Network `POST /favorites` → `GET /favorites/{movieId}`

📸 (사진) 즐겨찾기 해제 + Network `DELETE /favorites/{movieId}`

📸 (사진) 평점 등록 결과 + Network `POST /ratings` → `GET /members/{memberId}/ratings`

📸 (사진) 평점 수정 결과 + Network `PATCH /ratings/{ratingId}`

📸 (사진) 평점 삭제 결과 + Network `DELETE /ratings/{ratingId}`

### 배운 점

- 로그인 검사처럼 여러 페이지에 공통으로 필요한 로직은 Layout Route의 `beforeLoad`에 한 번만 두면 페이지가 늘어나도 코드를 반복 안 해도 됨.
- query key를 계층적으로 만들어 두면 `invalidateQueries`로 관련된 캐시를 한 번에 갱신할 수 있음.
- 변경 응답에 최신 데이터가 있으면 `setQueryData`, 없으면 `invalidateQueries`를 쓰면 됨. Network 탭에서 변경 요청 직후에 GET이 한 번 더 나가는지 보면 두 방식 차이가 바로 보임.

---

# 트러블 슈팅

## ⚡ 이슈 No.1

**`이슈`**

👉 회원가입 폼을 올바르게 채우고 가입하기를 눌러도 항상 "회원가입에 실패했어요. 다시 시도해 주세요." 알림이 뜸.

**`원인`**

👉 Network 탭을 보니 가입 요청이 `POST /api/members/signup`으로 가고 `404`가 나고 있었음. 서버의 실제 회원가입 주소는 `POST http://localhost:3000/members`임.
`signup-page.tsx` 안에 예전에 만들어둔 `useSignupMutation` 함수가 같은 이름으로 남아있었고, 이게 `fetch("/api/members/signup")`으로 요청을 보내고 있었음. 그래서 `src/hooks/use-signup-mutation.ts`에 만든 진짜 훅은 쓰이지 않고 있었음. (워크북 1.2의 import 교체가 빠져 있었음)

**`해결`**

👉 페이지 안의 가짜 `useSignupMutation` 함수를 지우고, `import { useSignupMutation } from "../../hooks/use-signup-mutation";`으로 진짜 훅을 가져오도록 바꿨음. 다시 가입해보니 `POST /members`가 `201`로 성공하고 로그인 페이지로 이동함.

**`배운 점`**

👉 실패 알림만 보고 서버 문제라고 생각하기 전에 Network 탭에서 요청이 어느 주소로 나가는지부터 확인해야 함. 같은 이름의 함수가 파일 안에 있으면 import한 것보다 그게 먼저 쓰일 수 있음.

## ⚡ 이슈 No.2

**`이슈`**

👉 영화 상세에서 북마크 버튼을 누르면 "즐겨찾기 변경에 실패했어요. 다시 시도해 주세요." 알림이 뜸.

**`원인`**

👉 Network 탭에서 `GET /favorites/{movieId}`, `POST /favorites`가 전부 `404 Cannot GET /favorites`로 실패하고 있었음. 프론트 코드 문제가 아니라, 로컬 백엔드 서버에 즐겨찾기 API가 아직 없었음. DB에는 `favorite` 테이블만 만들어져 있었음.

**`해결`**

👉 백엔드 8주차 워크북 내용대로 NestJS 서버에 `Favorite` 엔티티, DTO, Service, Controller를 추가해서 `GET/POST /favorites`, `GET/DELETE /favorites/{movieId}`를 만들었음. 응답 형태(`result: [{ movieId, ... }]`, `result: { isFavorite }`)가 프론트에서 기대하는 모양과 맞아서 프론트는 수정 안 해도 됐음. 이후 북마크 추가/해제가 정상 동작함.

**`배운 점`**

👉 프론트에서 API를 연결할 때는 응답 모양을 API 명세와 먼저 맞춰두는 게 중요함. 실패 원인이 프론트인지 서버인지는 상태 코드(404/401/400)로 먼저 구분하면 빨리 찾을 수 있음.

**`참고 레퍼런스`**

- TanStack Router - File Naming Conventions: https://tanstack.com/router/latest/docs/routing/file-naming-conventions
- TanStack Query - Query Invalidation: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
