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
