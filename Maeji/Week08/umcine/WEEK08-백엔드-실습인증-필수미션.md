# 백엔드 8주차 실습 인증 · 필수 미션 기록

> 📌 표시 설명
> - 🔁 **겹침**: 실습 인증과 필수 미션에 **같은 사진**을 써도 되는 항목이에요. 한 번만 찍어서 두 곳에 넣으면 돼요.
> - 📸 사진 자리: 직접 캡처해서 넣어야 해요.
> - 노션에 붙여 넣기 전에 이 상자와 맨 아래 **PART 3 (Postman 사용법)** 은 지워도 돼요.

---

# PART 1. ☑️ 실습 인증

### 1. 즐겨찾기 등록 성공 + 중복 오류

`POST /favorites`로 `movieId: 550`을 등록하면 `201`과 함께 등록된 즐겨찾기 정보가 옴.
같은 요청을 한 번 더 보내면 서버의 사전 검사에 걸려서 `409 FAVORITE409_1`이 옴.

📸 (사진 A) `POST /favorites` 201 성공 응답 🔁
📸 (사진 B) 같은 요청 409 `FAVORITE409_1` 응답 🔁

### 2. 목록 · 여부 · 해제 응답

- `GET /favorites` → 내 즐겨찾기만 최신 등록 순으로 배열로 옴.
- `GET /favorites/550` → 등록 후라서 `isFavorite: true`.
- `DELETE /favorites/550` → `200`, `COMMON200`, `result: null`.

📸 (사진 C) `GET /favorites` 목록 응답 🔁
📸 (사진 D) `GET /favorites/550` 여부 응답 (`isFavorite: true`) 🔁
📸 (사진 E) `DELETE /favorites/550` 해제 응답 🔁

### 3. 영화 기록 저장 성공

`POST /movie-records`에 `movieId: 238`, `addToFavorites: true`로 보내면 `result.rating`과 `result.favorite`가 둘 다 채워져서 옴.

📸 (사진 F) `POST /movie-records` 201 응답 (`rating`, `favorite` 둘 다 보이게) 🔁

### 4. 트랜잭션 코드

📸 (사진 G) `src/service/movie-record.service.ts`의 `this.dataSource.transaction(async (manager) => { ... })` 부분 코드 캡처 🔁

**두 저장을 묶은 이유 (한 문장)**
👉 평점과 즐겨찾기는 "영화 기록"이라는 한 번의 사용자 행동이라서, 둘 중 하나만 저장되면 사용자가 의도한 기록과 달라지기 때문에 하나라도 실패하면 둘 다 rollback 되도록 한 트랜잭션으로 묶었음.

---

# PART 2. 🔥 필수 미션 — 즐겨찾기와 영화 기록 기능 완성하기

선택 스택: **NestJS**

## 1. 구현 내용

5주차에 SQL로 만들어둔 `favorite` 테이블을 엔티티로 연결하고, 즐겨찾기 API 4개와 영화 기록 API 1개를 만들었음.

| API | Method | URL | 요청 | 성공 응답 |
| --- | --- | --- | --- | --- |
| 즐겨찾기 등록 | POST | `/favorites` | Body: `movieId` | 201 |
| 내 즐겨찾기 조회 | GET | `/favorites` | Header: `Authorization` | 200 |
| 즐겨찾기 여부 조회 | GET | `/favorites/{movieId}` | Header: `Authorization` | 200 |
| 즐겨찾기 해제 | DELETE | `/favorites/{movieId}` | Header: `Authorization` | 200 |
| 영화 기록 저장 | POST | `/movie-records` | Body: `movieId`, `score`, `comment`, `addToFavorites` | 201 |

**만든 파일**

```text
src/
├── entity/favorite.entity.ts
├── dto/
│   ├── create-favorite.dto.ts
│   ├── favorite-response.dto.ts
│   ├── favorite-status-response.dto.ts
│   ├── create-movie-record.dto.ts
│   └── movie-record-response.dto.ts
├── service/
│   ├── favorite.service.ts
│   └── movie-record.service.ts
├── controller/
│   ├── favorite.controller.ts
│   └── movie-record.controller.ts
└── app.module.ts   # Favorite 엔티티, 컨트롤러 2개, 서비스 2개 등록
```

## 2. 핵심 코드

### 토큰에서 회원 식별 (memberId를 요청으로 받지 않음)

컨트롤러 전체에 `AuthGuard`를 붙이고, Guard가 토큰의 `sub`에서 꺼내 `request.memberId`에 담아둔 값을 사용함. URL·바디·쿼리 어디에도 `memberId`가 없음.

```ts
@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() request: AuthenticatedRequest, @Body() dto: CreateFavoriteDto) {
    const memberId = request.memberId; // 토큰에서 꺼낸 회원 번호
    const result = await this.favoriteService.create(memberId, dto);

    return {
      isSuccess: true,
      code: 'COMMON201',
      message: '즐겨찾기를 등록했습니다.',
      result,
    };
  }
  // ...
}
```

### 중복 검사 + DB UNIQUE 제약

```ts
// favorite.entity.ts
@Entity('favorite')
@Unique('uk_favorite_member_movie', ['member', 'movieId'])
export class Favorite extends BaseTimeEntity { ... }

// favorite.service.ts
const existing = await this.favoriteRepository.findOne({
  where: { member: { memberId }, movieId: dto.movieId },
});
if (existing) {
  throw new ApiException(HttpStatus.CONFLICT, 'FAVORITE409_1', '이미 이 영화를 즐겨찾기하셨습니다.');
}
```

서버의 사전 검사는 `FAVORITE409_1`처럼 친절한 오류를 주기 위한 것이고, DB의 `(member_id, movie_id)` 복합 UNIQUE 제약은 동시에 요청이 들어와도 중복 저장을 막아주는 마지막 안전망이라서 둘 다 남겨뒀음.

### 영화 기록 트랜잭션

```ts
async create(memberId: number, dto: CreateMovieRecordDto): Promise<MovieRecordResponseDto> {
  return this.dataSource.transaction(async (manager) => {
    // 콜백 안에서는 manager가 만든 Repository만 사용
    const memberRepository = manager.getRepository(Member);
    const ratingRepository = manager.getRepository(Rating);
    const favoriteRepository = manager.getRepository(Favorite);

    // 회원 확인 → 평점 중복(RATING409_1) → 즐겨찾기 중복(FAVORITE409_1) 검사

    const savedRating = await ratingRepository.save(
      ratingRepository.create({ member, movieId: dto.movieId, score: dto.score, comment: dto.comment ?? null }),
    );

    let favoriteResponse: FavoriteResponseDto | null = null;
    if (dto.addToFavorites) {
      const savedFavorite = await favoriteRepository.save(
        favoriteRepository.create({ member, movieId: dto.movieId }),
      );
      favoriteResponse = FavoriteResponseDto.from(savedFavorite);
    }

    return MovieRecordResponseDto.of(RatingResponseDto.from(savedRating), favoriteResponse);
  });
}
```

- `RatingService.create()`랑 `FavoriteService.create()`를 연달아 부르면 각각 따로 저장돼서 중간에 실패해도 앞에 저장한 게 남을 수 있음. 그래서 영화 기록 전용 Service를 만들고 `dataSource.transaction()` 하나로 묶었음.
- 콜백이 정상으로 끝나면 commit, 중간에 예외가 나면 rollback 됨.
- 콜백 안에서 생성자로 주입받은 Repository를 섞어 쓰면 같은 트랜잭션 연결이라는 보장이 없어서 `manager.getRepository()`로만 꺼내 썼음.

## 3. 결과 캡처

| 확인 항목 | 기대 결과 | 사진 |
| --- | --- | --- |
| `POST /favorites` | 201, `COMMON201` | 🔁 사진 A |
| 같은 영화 다시 등록 | 409, `FAVORITE409_1` | 🔁 사진 B |
| `GET /favorites` | 200, 내 즐겨찾기 배열 | 🔁 사진 C |
| `GET /favorites/550` (등록 후) | 200, `isFavorite: true` | 🔁 사진 D |
| `DELETE /favorites/550` | 200, `result: null` | 🔁 사진 E |
| `POST /movie-records` | 201, `rating` + `favorite` | 🔁 사진 F |
| 트랜잭션 코드 | `dataSource.transaction()` | 🔁 사진 G |
| 같은 영화 기록 다시 저장 | 409, `RATING409_1` | 📸 사진 H (필수 미션만) |
| 토큰 없이 `POST /favorites` | 401, `AUTH401_2` | 📸 사진 I (필수 미션만) |
| `GET /favorites/550` (해제 후) | 200, `isFavorite: false` | 📸 사진 J (필수 미션만) |
| 없는 즐겨찾기 해제 | 404, `FAVORITE404_1` | 📸 사진 K (필수 미션만) |
| `movieId: 0` 등록 | 400 | 📸 사진 L (필수 미션만) |

> H~L은 필수 미션 "제출물"에 꼭 있어야 하는 건 아니지만, 워크북 [실습 4] 실패 상황을 확인한 증거라서 넣으면 좋음.

📸 사진 A ~ L 순서대로 넣기

## 4. 확인 포인트 점검

- [x] 요청의 URL/바디/쿼리에 `memberId`가 없고, 토큰에서 회원을 식별함 → 모든 컨트롤러가 `request.memberId` 사용
- [x] 영화 기록 Service에서 두 저장이 하나의 트랜잭션으로 묶임 → `dataSource.transaction()` 콜백 안에서 저장
- [x] 이미 즐겨찾기한 영화로 영화 기록을 저장하면 `FAVORITE409_1`로 실패하고, DB에 평점도 새로 생기지 않는 것을 확인함

## 5. 코드 링크

- 🔗 (GitHub 링크) `src/controller/favorite.controller.ts`
- 🔗 (GitHub 링크) `src/service/favorite.service.ts`
- 🔗 (GitHub 링크) `src/service/movie-record.service.ts`

## 6. 막힌 점과 해결 과정

### ⚡ 이슈 No.1

**`이슈`**

👉 워크북 코드대로 컨트롤러를 작성했더니 빌드할 때 아래 오류가 남.

```
src/controller/movie-record.controller.ts:24:22 - error TS7053: Element implicitly has an 'any' type because expression of type '"memberId"' can't be used to index type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.
  Property 'memberId' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.
```

**`문제`**

👉 워크북은 express의 `Request` 타입에서 `request['memberId']`로 값을 꺼내는데, express `Request` 타입에는 `memberId`라는 속성이 없음. 내 프로젝트는 tsconfig가 엄격하게 설정돼 있어서 `any`로 넘어가지 않고 오류가 남.

**`해결`**

👉 7주차에 `auth.guard.ts`에서 만들어둔 `AuthenticatedRequest`(Request를 확장해서 `memberId: number`를 추가한 타입)를 import해서 `@Req() request: AuthenticatedRequest`로 바꾸고 `request.memberId`로 꺼냈음. 7주차 평점 컨트롤러도 이 방식이라 코드 스타일도 맞춰짐.

### ⚡ 이슈 No.2

**`이슈`**

👉 위 오류를 고쳤는데도 서버가 응답을 안 함. `npm run start:dev`(watch 모드) 프로세스는 살아있는데 3000번 포트가 비어 있었음.

**`문제`**

👉 watch 모드가 컴파일 오류가 났을 때 앱을 내렸다가, 오류를 고친 뒤에도 앱을 다시 띄우지 못하고 멈춰 있었음. `node dist/main`으로 직접 실행해보니 새 라우트(`/favorites`, `/movie-records`)까지 정상으로 매핑되고 앱이 잘 떠서 코드 문제는 아니었음.

**`해결`**

👉 터미널에서 Ctrl+C로 watch 서버를 끄고 `npm run start:dev`로 다시 실행했음.

### ⚡ 이슈 No.3

**`이슈`**

👉 프론트에서 북마크를 누르면 "즐겨찾기 변경에 실패했어요" 알림이 떴음.

**`문제`**

👉 Network 탭에서 `/favorites` 요청이 전부 `404 Cannot GET /favorites`였음. DB에 `favorite` 테이블만 있고 백엔드에 즐겨찾기 API가 아직 없었기 때문임.

**`해결`**

👉 이번 주차 즐겨찾기 API를 만들고 나니 프론트 북마크 추가/해제가 정상 동작함.

## 7. 핵심 키워드 / 학습 후기 (짧게)

1. **트랜잭션이 없을 때 평점만 저장되고 즐겨찾기가 안 되면 왜 문제일까?**
   👉 사용자는 "5점 주고 즐겨찾기도 넣기"를 한 번에 요청했는데 일부만 저장되면 사용자가 의도한 기록과 DB 상태가 달라짐. 다시 요청하면 이번엔 평점 중복(`RATING409_1`)에 걸려서 즐겨찾기를 영영 못 넣는 어중간한 상태가 됨.
2. **서버 중복 검사와 DB UNIQUE 제약을 둘 다 두는 이유는?**
   👉 서버 검사는 `FAVORITE409_1`처럼 이유가 분명한 오류를 주기 위해서고, 두 요청이 거의 동시에 들어오면 둘 다 검사를 통과할 수 있어서 최종적으로 데이터를 지키는 건 DB의 UNIQUE 제약임.

---

# PART 3. 📮 Postman 사용법 (기록에는 안 넣어도 됨)

## 0. 준비

1. 백엔드 서버 실행: `D:\dev\movie`에서 `npm run start:dev`
2. Postman 실행 → 왼쪽 **Collections**에서 `+` → 이름 `UMC 8주차`

## 1. 토큰을 변수로 저장해두기 (한 번만)

매 요청마다 토큰을 붙여 넣기 귀찮으니 컬렉션 변수로 둬요.

1. 컬렉션 `UMC 8주차` 클릭 → **Variables** 탭
2. 변수 2개 추가

| Variable | Current value |
| --- | --- |
| `baseUrl` | `http://localhost:3000` |
| `token` | (비워두기) |

3. **Authorization** 탭 → Auth Type: **Bearer Token** → Token 칸에 `{{token}}` 입력 → 저장(Ctrl+S)
   - 이러면 컬렉션 안의 모든 요청에 `Authorization: Bearer {토큰}` 헤더가 자동으로 붙어요.

## 2. 로그인해서 토큰 받기

1. 컬렉션에서 **Add request** → 이름 `로그인`
2. Method `POST`, URL `{{baseUrl}}/auth/login`
3. **Body** 탭 → **raw** 선택 → 오른쪽 드롭다운 **JSON**
   ```json
   {
     "email": "본인이메일@umc.com",
     "password": "본인비밀번호"
   }
   ```
4. **Send** → 응답의 `result.accessToken` 값 복사
5. 컬렉션 **Variables** → `token`의 Current value에 붙여 넣고 저장

> 자동으로 하고 싶으면 로그인 요청의 **Scripts → Post-response**에 아래를 넣으면 Send할 때마다 토큰이 저장돼요.
> ```js
> pm.collectionVariables.set("token", pm.response.json().result.accessToken);
> ```

## 3. 요청 만들기 (순서대로 Send)

| # | 이름 | Method | URL | Body (raw JSON) | 기대 | 사진 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 즐겨찾기 등록 | POST | `{{baseUrl}}/favorites` | `{ "movieId": 550 }` | 201 | A |
| 2 | (1번 다시 Send) | | | | 409 `FAVORITE409_1` | B |
| 3 | 내 즐겨찾기 | GET | `{{baseUrl}}/favorites` | 없음 | 200 배열 | C |
| 4 | 즐겨찾기 여부 | GET | `{{baseUrl}}/favorites/550` | 없음 | `isFavorite: true` | D |
| 5 | 즐겨찾기 해제 | DELETE | `{{baseUrl}}/favorites/550` | 없음 | 200 `result: null` | E |
| 6 | (4번 다시 Send) | | | | `isFavorite: false` | J |
| 7 | (5번 다시 Send) | | | | 404 `FAVORITE404_1` | K |
| 8 | 영화 기록 | POST | `{{baseUrl}}/movie-records` | 아래 참고 | 201 | F |
| 9 | (8번 다시 Send) | | | | 409 `RATING409_1` | H |
| 10 | 토큰 없이 등록 | POST | `{{baseUrl}}/favorites` | `{ "movieId": 550 }` | 401 `AUTH401_2` | I |
| 11 | 잘못된 ID | POST | `{{baseUrl}}/favorites` | `{ "movieId": 0 }` | 400 | L |

8번 Body:

```json
{
  "movieId": 238,
  "score": 5,
  "comment": "다시 보고 싶은 영화입니다.",
  "addToFavorites": true
}
```

- **10번 토큰 없이 보내기**: 그 요청의 **Authorization** 탭에서 Auth Type을 **No Auth**로 바꾸면 돼요. (컬렉션 설정을 상속하지 않게)
- **이미 238번에 평점이 있으면** 8번이 처음부터 409가 나요. 그럴 땐 다른 영화 ID(예: `680`, `13`)로 바꿔서 보내요.
- 처음부터 다시 찍고 싶으면 먼저 `DELETE /favorites/550`을 보내서 비워두고 시작해요.

## 4. 캡처할 때 팁

- 한 장에 **Method + URL**, **Body(보낸 경우)**, **응답 상태 코드(오른쪽 위 `201 Created` 등)**, **응답 JSON**이 다 보이게 찍어요.
- 화면이 좁으면 Postman 아래쪽 응답 영역을 위로 끌어올리거나, 요청 Body와 응답을 두 장으로 나눠도 돼요.
- 토큰 값이 보이는 화면(로그인 응답, Variables 탭)은 캡처하지 않거나 가리고 올려요.
