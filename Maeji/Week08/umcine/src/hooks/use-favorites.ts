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
