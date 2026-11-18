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
