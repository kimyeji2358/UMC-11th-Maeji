import { useState, type FormEvent } from "react";
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../components/auth/form-styles";
import { AuthLayout } from "../../components/layout/auth-layout";
import { isNicknameValid } from "../../utils/members/validation";

// 내 정보 조회 API는 8주차에 연결해요. 지금은 화면 확인용 값을 사용해요.
const MOCK_MEMBER = {
  email: "umc@example.com",
  nickname: "매지",
};

export function MyPage() {
  const [member, setMember] = useState(MOCK_MEMBER);
  const [isEditing, setIsEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(member.nickname);

  const nickname = nicknameInput.trim();
  const isNicknameInputValid = isNicknameValid(nickname);
  const canSave = isNicknameInputValid && nickname !== member.nickname;

  function handleStartEdit() {
    setNicknameInput(member.nickname);
    setIsEditing(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    // 내 정보 수정 API는 8주차에 연결해요. 지금은 화면의 상태만 바꿔요.
    setMember((previousMember) => ({ ...previousMember, nickname }));
    setIsEditing(false);
  }

  return (
    <AuthLayout title="내 정보">
      {isEditing ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="my-page-email" className={LABEL_CLASS}>
              이메일
            </label>
            <input
              id="my-page-email"
              type="email"
              disabled
              className={INPUT_CLASS}
              value={member.email}
            />
          </div>

          <div>
            <label htmlFor="my-page-nickname" className={LABEL_CLASS}>
              닉네임
            </label>
            <input
              id="my-page-nickname"
              type="text"
              autoComplete="nickname"
              placeholder="2~12자"
              className={INPUT_CLASS}
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
            />

            {!isNicknameInputValid && (
              <p className={ERROR_CLASS}>
                닉네임은 2자 이상 12자 이하로 입력해 주세요.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={PRIMARY_BUTTON_CLASS}
            >
              저장
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className="mb-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <img src="/icons/mail.svg" alt="" className="size-5 opacity-60" />
              <dt className="w-14 shrink-0 text-sm font-semibold">이메일</dt>
              <dd className="min-w-0 break-all text-sm text-slate-600">
                {member.email}
              </dd>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <img
                src="/icons/person.svg"
                alt=""
                className="size-5 opacity-60"
              />
              <dt className="w-14 shrink-0 text-sm font-semibold">닉네임</dt>
              <dd className="min-w-0 break-all text-sm text-slate-600">
                {member.nickname}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleStartEdit}
            className={PRIMARY_BUTTON_CLASS}
          >
            정보 수정
          </button>
        </>
      )}
    </AuthLayout>
  );
}
