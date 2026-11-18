// src/service/movie-record.service.ts
import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateMovieRecordDto } from '../dto/create-movie-record.dto';
import { FavoriteResponseDto } from '../dto/favorite-response.dto';
import { MovieRecordResponseDto } from '../dto/movie-record-response.dto';
import { RatingResponseDto } from '../dto/rating-response.dto';
import { Favorite } from '../entity/favorite.entity';
import { Member } from '../entity/member.entity';
import { Rating } from '../entity/rating.entity';
import { ApiException } from '../exception/api.exception';

@Injectable()
export class MovieRecordService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 평점과 즐겨찾기를 하나의 트랜잭션으로 저장합니다.
   * 콜백이 정상적으로 끝나면 commit, 중간에 예외가 나면 rollback 되어
   * 평점만 저장되고 즐겨찾기는 빠지는 어중간한 상태가 남지 않습니다.
   */
  async create(
    memberId: number,
    dto: CreateMovieRecordDto,
  ): Promise<MovieRecordResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const memberRepository = manager.getRepository(Member);
      const ratingRepository = manager.getRepository(Rating);
      const favoriteRepository = manager.getRepository(Favorite);

      const member = await memberRepository.findOneBy({ memberId });
      if (!member) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          'MEMBER404_1',
          '해당 회원을 찾을 수 없습니다.',
        );
      }

      const existingRating = await ratingRepository.findOne({
        where: { member: { memberId }, movieId: dto.movieId },
      });
      if (existingRating) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          'RATING409_1',
          '이미 이 영화에 평점을 남기셨습니다.',
        );
      }

      if (dto.addToFavorites) {
        const existingFavorite = await favoriteRepository.findOne({
          where: { member: { memberId }, movieId: dto.movieId },
        });
        if (existingFavorite) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            'FAVORITE409_1',
            '이미 이 영화를 즐겨찾기하셨습니다.',
          );
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

      return MovieRecordResponseDto.of(
        RatingResponseDto.from(savedRating),
        favoriteResponse,
      );
    });
  }
}
