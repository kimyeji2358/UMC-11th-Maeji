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
