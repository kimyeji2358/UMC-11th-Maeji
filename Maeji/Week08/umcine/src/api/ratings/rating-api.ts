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
