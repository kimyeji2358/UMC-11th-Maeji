# 🔥 필수 미션 — 즐겨찾기와 영화 기록 기능 완성하기

선택 스택: **NestJS**

## 1. 미션 내용 정리

이번 미션은 회원이 마음에 드는 영화를 보관하는 **즐겨찾기 API 4개**와, 평점과 즐겨찾기를 한 번에 저장하는 **영화 기록 API 1개**를 만드는 것.
영화 정보 자체는 TMDB에 있으니까 우리 서버는 "어떤 회원이 어떤 TMDB 영화 ID를 보관했는지"라는 관계만 저장함.

| API | Method | URL | 요청 | 성공 응답 |
| --- | --- | --- | --- | --- |
| 즐겨찾기 등록 | POST | `/favorites` | Body: `movieId` | 201 |
| 내 즐겨찾기 조회 | GET | `/favorites` | Header: `Authorization` | 200 |
| 특정 영화 즐겨찾기 여부 조회 | GET | `/favorites/{movieId}` | Header: `Authorization` | 200 |
| 즐겨찾기 해제 | DELETE | `/favorites/{movieId}` | Header: `Authorization` | 200 |
| 영화 기록 저장 | POST | `/movie-records` | Body: `movieId`, `score`, `comment`, `addToFavorites` | 201 |

이번 주에 새로 생긴 실패 코드

| code | 상태 | 언제 |
| --- | --- | --- |
| `FAVORITE404_1` | 404 | 해제하려는 즐겨찾기가 없음 |
| `FAVORITE409_1` | 409 | 이미 같은 영화를 즐겨찾기함 |

## 2. 만든 파일

```text
src/
├── entity/
│   └── favorite.entity.ts              # Favorite 엔티티 (BaseTimeEntity 상속)
├── dto/
│   ├── create-favorite.dto.ts          # POST /favorites 요청 검증
│   ├── favorite-response.dto.ts        # 즐겨찾기 응답
│   ├── favorite-status-response.dto.ts # { isFavorite } 응답
│   ├── create-movie-record.dto.ts      # POST /movie-records 요청 검증
│   └── movie-record-response.dto.ts    # { rating, favorite } 응답
├── service/
│   ├── favorite.service.ts
│   └── movie-record.service.ts         # 트랜잭션
├── controller/
│   ├── favorite.controller.ts
│   └── movie-record.controller.ts
└── app.module.ts                       # Favorite, 컨트롤러 2개, 서비스 2개 등록
```

## 3. 핵심 코드

### 3-1. Favorite 엔티티

즐겨찾기는 영화의 속성이 아니라 **회원과 영화의 관계**라서 `Member`와 `movieId`를 같이 가짐.
`movie_id`는 TMDB 영화 ID라 우리 DB에 movie 테이블이 없고, 외래 키도 아님.

```ts
@Entity('favorite')
@Unique('uk_favorite_member_movie', ['member', 'movieId'])
export class Favorite extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ name: 'favorite_id' })
  favoriteId: number;

  // 즐겨찾기의 주인은 로그인한 회원
  @ManyToOne(() => Member, { nullable: false })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  // TMDB 영화 ID를 그대로 저장 (외래 키 아님)
  @Column({ name: 'movie_id' })
  movieId: number;
}
```

- 생성/수정 시각은 다시 선언하지 않고 5주차부터 쓰던 `BaseTimeEntity`를 상속함.
- `(member_id, movie_id)` 복합 UNIQUE로 같은 회원이 같은 영화를 두 번 즐겨찾기하지 못하게 함. `movie_id`만 UNIQUE로 걸면 서비스 전체에서 한 영화가 한 번만 즐겨찾기될 수 있어서 반드시 두 값을 한 쌍으로 묶어야 함.

### 3-2. 토큰에서 회원 식별 — memberId를 요청으로 받지 않음

컨트롤러 전체에 `AuthGuard`를 붙였고, Guard가 토큰의 `sub`에서 꺼내서 `request.memberId`에 담아둔 값을 사용함.
URL, 바디, 쿼리 어디에도 `memberId`가 없음.

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

  @Get(':movieId')
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @Req() request: AuthenticatedRequest,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) { ... }

  @Delete(':movieId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    const memberId = request.memberId;
    await this.favoriteService.delete(memberId, movieId);

    // 삭제 성공도 공통 응답 형식을 지키려고 200 + result: null
    return {
      isSuccess: true,
      code: 'COMMON200',
      message: '즐겨찾기를 해제했습니다.',
      result: null,
    };
  }
}
```

### 3-3. 즐겨찾기 Service — 중복 검사와 여부 조회

```ts
async create(memberId: number, dto: CreateFavoriteDto): Promise<FavoriteResponseDto> {
  const member = await this.memberRepository.findOneBy({ memberId });
  if (!member) {
    throw new ApiException(HttpStatus.NOT_FOUND, 'MEMBER404_1', '해당 회원을 찾을 수 없습니다.');
  }

  // 사전 검사: 사용자에게 FAVORITE409_1이라는 분명한 오류를 주기 위함
  const existing = await this.favoriteRepository.findOne({
    where: { member: { memberId }, movieId: dto.movieId },
  });
  if (existing) {
    throw new ApiException(HttpStatus.CONFLICT, 'FAVORITE409_1', '이미 이 영화를 즐겨찾기하셨습니다.');
  }

  const saved = await this.favoriteRepository.save(
    this.favoriteRepository.create({ member, movieId: dto.movieId }),
  );
  return FavoriteResponseDto.from(saved);
}

async getStatus(memberId: number, movieId: number): Promise<FavoriteStatusResponseDto> {
  // 즐겨찾기 안 한 건 오류가 아니라 정상 상태 → 200 + isFavorite: false
  const isFavorite = await this.favoriteRepository.exists({
    where: { member: { memberId }, movieId },
  });
  return FavoriteStatusResponseDto.from(isFavorite);
}
```

- 서버의 사전 검사는 친절한 오류 메시지를 위한 것이고, DB의 UNIQUE 제약은 두 요청이 거의 동시에 들어와서 둘 다 사전 검사를 통과하는 경우까지 막아주는 마지막 안전망이라 둘 다 남겨뒀음.
- 목록 조회는 `order: { favoriteId: 'DESC' }`로 최근에 등록한 순서대로 보여줌.

### 3-4. 영화 기록 — 평점과 즐겨찾기를 하나의 트랜잭션으로

```ts
@Injectable()
export class MovieRecordService {
  constructor(private readonly dataSource: DataSource) {}

  async create(memberId: number, dto: CreateMovieRecordDto): Promise<MovieRecordResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      // 이 콜백 안에서는 manager가 만든 Repository만 사용
      const memberRepository = manager.getRepository(Member);
      const ratingRepository = manager.getRepository(Rating);
      const favoriteRepository = manager.getRepository(Favorite);

      const member = await memberRepository.findOneBy({ memberId });
      if (!member) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'MEMBER404_1', '해당 회원을 찾을 수 없습니다.');
      }

      const existingRating = await ratingRepository.findOne({
        where: { member: { memberId }, movieId: dto.movieId },
      });
      if (existingRating) {
        throw new ApiException(HttpStatus.CONFLICT, 'RATING409_1', '이미 이 영화에 평점을 남기셨습니다.');
      }

      if (dto.addToFavorites) {
        const existingFavorite = await favoriteRepository.findOne({
          where: { member: { memberId }, movieId: dto.movieId },
        });
        if (existingFavorite) {
          throw new ApiException(HttpStatus.CONFLICT, 'FAVORITE409_1', '이미 이 영화를 즐겨찾기하셨습니다.');
        }
      }

      const savedRating = await ratingRepository.save(
        ratingRepository.create({
          member,
          movieId: dto.movieId,
          score: dto.score,
          comment: dto.comment ?? null,
        }),
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
}
```

- `RatingService.create()`와 `FavoriteService.create()`를 연달아 부르면 각각 따로 저장돼서, 중간에 하나가 실패해도 먼저 저장한 게 남을 수 있음. 그래서 "영화 기록"이라는 한 가지 행동을 처리하는 전용 Service를 만들고 `dataSource.transaction()` 하나로 묶었음.
- 콜백이 정상으로 끝나면 commit, 중간에 예외가 나면 rollback 됨.
- 콜백 안에서 생성자로 주입받은 Repository를 섞어 쓰면 같은 트랜잭션 연결이라는 보장이 없어서 `manager.getRepository()`로만 꺼내 씀.
- 평점 중복은 7주차에 만든 `RATING409_1`을 그대로 씀. 같은 의미라 새 코드를 만들 필요가 없었음.

## 4. Postman 결과

먼저 `POST /auth/login`으로 토큰을 받고, 아래 요청들은 모두 **Authorization → Bearer Token**에 토큰을 넣고 보냈음.

### 4-1. 즐겨찾기 등록 — `POST /favorites`

Body: `{ "movieId": 550 }`
→ `201 Created`, `COMMON201`, `favoriteId`, `movieId`, `createdAt`이 옴.

📸 (사진) POST /favorites 201

### 4-2. 같은 영화 중복 등록 — `POST /favorites`

같은 요청을 한 번 더 보냄.
→ `409 Conflict`, `FAVORITE409_1`

📸 (사진) POST /favorites 409 FAVORITE409_1

### 4-3. 내 즐겨찾기 조회 — `GET /favorites`

→ `200 OK`, 내가 등록한 즐겨찾기만 최신 순서로 배열로 옴.

📸 (사진) GET /favorites 200

### 4-4. 즐겨찾기 여부 조회 — `GET /favorites/550`

→ `200 OK`, `isFavorite: true`

📸 (사진) GET /favorites/550 isFavorite: true

### 4-5. 즐겨찾기 해제 — `DELETE /favorites/550`

→ `200 OK`, `COMMON200`, `result: null`

📸 (사진) DELETE /favorites/550 200

### 4-6. 영화 기록 저장 — `POST /movie-records`

```json
{
  "movieId": 238,
  "score": 5,
  "comment": "다시 보고 싶은 영화입니다.",
  "addToFavorites": true
}
```

→ `201 Created`, `result.rating`과 `result.favorite`가 둘 다 채워져서 옴.

📸 (사진) POST /movie-records 201

### 4-7. 실패 상황 확인 (워크북 실습 4)

| 상황 | 결과 |
| --- | --- |
| 토큰 없이 `POST /favorites` | 401, `AUTH401_2` |
| 해제 후 `GET /favorites/550` | 200, `isFavorite: false` |
| 없는 즐겨찾기 `DELETE /favorites/550` | 404, `FAVORITE404_1` |
| `POST /favorites`에 `movieId: 0` | 400, "영화 ID는 양수여야 합니다." |
| 같은 영화로 `POST /movie-records` 다시 | 409, `RATING409_1` |

📸 (사진) 토큰 없이 POST /favorites 401
📸 (사진) 해제 후 GET /favorites/550 isFavorite: false
📸 (사진) DELETE /favorites/550 404 FAVORITE404_1
📸 (사진) POST /favorites movieId 0 → 400
📸 (사진) POST /movie-records 다시 → 409 RATING409_1

## 5. 확인 포인트 점검

- [x] 요청의 URL/바디/쿼리에 `memberId`가 없고, 토큰에서 회원을 식별함 → 모든 컨트롤러에서 `request.memberId` 사용
- [x] 영화 기록 Service에서 두 저장이 하나의 트랜잭션으로 묶임 → `dataSource.transaction()` 콜백 안에서 저장
- [x] 이미 즐겨찾기한 영화로 영화 기록을 저장하면 `FAVORITE409_1`로 실패하고, DB에 평점도 새로 생기지 않는 걸 확인함

## 6. 코드 링크

- 🔗 favorite.entity.ts:
- 🔗 favorite.controller.ts:
- 🔗 favorite.service.ts:
- 🔗 movie-record.controller.ts:
- 🔗 movie-record.service.ts:

## 7. 막힌 점과 해결 과정

### ⚡ 이슈 No.1

**`이슈`**

👉 워크북 코드대로 컨트롤러를 작성했더니 빌드할 때 아래 오류가 남.

```
src/controller/movie-record.controller.ts:24:22 - error TS7053: Element implicitly has an 'any' type because expression of type '"memberId"' can't be used to index type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.
  Property 'memberId' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.
```

**`문제`**

👉 워크북은 express의 `Request` 타입에서 `request['memberId']`로 값을 꺼내는데, express `Request` 타입에는 `memberId` 속성이 없음. 내 프로젝트는 tsconfig가 엄격하게 설정돼 있어서 `any`로 넘어가지 않고 오류가 남.

**`해결`**

👉 7주차에 `auth.guard.ts`에서 만들어둔 `AuthenticatedRequest`(Request를 확장해서 `memberId: number`를 추가한 타입)를 import해서 `@Req() request: AuthenticatedRequest`로 바꾸고 `request.memberId`로 꺼냈음. 7주차 평점 컨트롤러도 이 방식이라 코드 스타일도 맞춰짐.

### ⚡ 이슈 No.2

**`이슈`**

👉 위 오류를 고쳤는데도 서버가 응답을 안 함. `npm run start:dev`(watch 모드) 프로세스는 살아있는데 3000번 포트가 비어 있었음.

**`문제`**

👉 watch 모드가 컴파일 오류가 났을 때 앱을 내렸다가, 오류를 고친 뒤에도 앱을 다시 띄우지 못하고 멈춰 있었음. `node dist/main`으로 직접 실행해보니 새 라우트(`/favorites`, `/movie-records`)까지 정상으로 매핑되고 잘 떠서 코드 문제는 아니었음.

**`해결`**

👉 터미널에서 Ctrl+C로 watch 서버를 끄고 `npm run start:dev`로 다시 실행했음.

### ⚡ 이슈 No.3

**`이슈`**

👉 Postman에서 토큰을 넣고 `POST /favorites`를 보냈는데 `401 Unauthorized`가 옴.

```json
{
  "isSuccess": false,
  "code": "AUTH401_3",
  "message": "유효하지 않은 토큰입니다.",
  "result": null
}
```

**`문제`**

👉 `AUTH401_2`(토큰 없음)가 아니라 `AUTH401_3`이라서 토큰은 전달됐지만 서버의 `jwtService.verifyAsync()` 검증에서 실패한 거였음. 로그인 응답에서 토큰을 복사할 때 따옴표까지 같이 복사됐거나, Token 칸에 `Bearer `를 직접 써서 `Bearer Bearer ...`처럼 보내지는 등 토큰 문자열이 원래 모양과 달라져 있었음.

**`해결`**

👉 `POST /auth/login`을 다시 보내서 `accessToken` 값만 따옴표 없이 복사하고, Authorization 탭의 Bearer Token 칸에 토큰만 붙여 넣었음. 다시 보내니 `201 Created`가 옴.

**`배운 점`**

👉 401이라도 code로 원인을 나눠서 볼 수 있음. `AUTH401_2`는 헤더 자체가 없는 거고, `AUTH401_3`은 토큰 모양이나 서명이 잘못된 거고, `AUTH401_4`는 만료된 거라 다시 로그인하면 됨.

## 8. 학습 후기

1. **트랜잭션이 없을 때 평점만 저장되고 즐겨찾기가 저장되지 않으면 왜 문제일까?**
   👉 사용자는 "5점 주고 즐겨찾기에도 넣기"를 한 번에 요청했는데 일부만 저장되면 사용자가 의도한 기록과 DB 상태가 달라짐. 게다가 다시 요청하면 이번엔 평점 중복(`RATING409_1`)에 걸려서 즐겨찾기를 같은 방법으로는 다시 넣을 수 없는 어중간한 상태가 됨.

2. **서버의 중복 검사와 DB의 UNIQUE 제약을 둘 다 두는 이유는?**
   👉 서버 검사는 `FAVORITE409_1`처럼 이유가 분명한 오류를 주기 위해서고, 두 요청이 거의 동시에 들어오면 둘 다 검사를 통과할 수 있어서 최종적으로 데이터를 지키는 건 DB의 UNIQUE 제약임.

이번 주에 가장 이해가 잘 된 건 트랜잭션이 "오류를 없애주는 기능"이 아니라 "오류가 나도 데이터가 어중간하게 남지 않게 해주는 기능"이라는 점이었음. 아직 낯선 건 낙관적 잠금이라서 다음에 따로 찾아볼 예정임.
