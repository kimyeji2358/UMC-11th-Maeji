import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { checkEmailDuplicate } from "../../api/members/check-email-duplicate";
import { checkNicknameDuplicate } from "../../api/members/check-nickname-duplicate";
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../components/auth/form-styles";
import { AuthLayout } from "../../components/layout/auth-layout";
import { useSignupMutation } from "../../hooks/use-signup-mutation";
import {
  EMAIL_REGEX,
  isNicknameValid as checkNicknameValid,
  PASSWORD_REGEX,
} from "../../utils/members/validation";

const DEFAULT_FORM = {
  email: "",
  nickname: "",
  password: "",
  passwordConfirm: "",
};

const DEFAULT_DUPLICATE_CHECK = {
  isChecking: false,
  isAvailable: false,
};

type FormKey = keyof typeof DEFAULT_FORM;
type DuplicateCheckKey = "email" | "nickname";

type DuplicateFieldProps = {
  id: string;
  label: string;
  type: "email" | "text";
  autoComplete: string;
  placeholder: string;
  value: string;
  isValid: boolean;
  isChecking: boolean;
  isAvailable: boolean;
  errorMessage: string;
  onChange: (value: string) => void;
  onCheck: () => void;
};

function DuplicateField({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  isValid,
  isChecking,
  isAvailable,
  errorMessage,
  onChange,
  onCheck,
}: DuplicateFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={isChecking}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT_CLASS} pr-24`}
        />

        <button
          type="button"
          disabled={!isValid || isChecking}
          onClick={onCheck}
          className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-xs font-semibold text-blue-600 enabled:hover:bg-blue-50 disabled:opacity-45"
        >
          {isChecking ? "확인 중" : "중복 확인"}
        </button>
      </div>

      {value.length > 0 && !isValid && (
        <p className={ERROR_CLASS}>{errorMessage}</p>
      )}

      {isAvailable && (
        <p className="mt-1.5 text-xs text-emerald-700">
          사용할 수 있는 {label}이에요.
        </p>
      )}
    </div>
  );
}

export function SignupPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [duplicateCheck, setDuplicateCheck] = useState({
    email: DEFAULT_DUPLICATE_CHECK,
    nickname: DEFAULT_DUPLICATE_CHECK,
  });
  const signupMutation = useSignupMutation();

  const email = form.email.trim();
  const nickname = form.nickname.trim();

  const isEmailValid = EMAIL_REGEX.test(email);
  const isNicknameValid = checkNicknameValid(nickname);
  const isPasswordValid = PASSWORD_REGEX.test(form.password);
  const isPasswordConfirmValid =
    form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;

  const canSubmit =
    isEmailValid &&
    isNicknameValid &&
    isPasswordValid &&
    isPasswordConfirmValid &&
    duplicateCheck.email.isAvailable &&
    duplicateCheck.nickname.isAvailable;

  function handleChangeField(key: FormKey, value: string) {
    if (key === "email" || key === "nickname") {
      if (duplicateCheck[key].isChecking) return;

      // 값을 바꾸면 해당 입력칸의 중복 확인을 다시 진행해야 해요.
      setDuplicateCheck((previousCheck) => ({
        ...previousCheck,
        [key]: DEFAULT_DUPLICATE_CHECK,
      }));
    }

    setForm((previousForm) => ({ ...previousForm, [key]: value }));
  }

  async function handleCheckDuplicate(key: DuplicateCheckKey) {
    const isValid = key === "email" ? isEmailValid : isNicknameValid;
    if (!isValid || duplicateCheck[key].isChecking || signupMutation.isPending)
      return;

    const label = key === "email" ? "이메일" : "닉네임";
    let isAvailable = false;

    setDuplicateCheck((previousCheck) => ({
      ...previousCheck,
      [key]: { isChecking: true, isAvailable: false },
    }));

    try {
      const response =
        key === "email"
          ? await checkEmailDuplicate(email)
          : await checkNicknameDuplicate(nickname);

      isAvailable = response.available;

      alert(
        isAvailable
          ? `사용할 수 있는 ${label}이에요.`
          : `이미 사용 중인 ${label}이에요.`,
      );
    } catch {
      alert("중복 확인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setDuplicateCheck((previousCheck) => ({
        ...previousCheck,
        [key]: { isChecking: false, isAvailable },
      }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || signupMutation.isPending) return;

    signupMutation.mutate({ email, nickname, password: form.password });
  }

  return (
    <AuthLayout title="회원가입">
      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={signupMutation.isPending} className="space-y-4">
          <DuplicateField
            id="signup-email"
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            isValid={isEmailValid}
            isChecking={duplicateCheck.email.isChecking}
            isAvailable={duplicateCheck.email.isAvailable}
            errorMessage="올바른 이메일 형식으로 입력해 주세요."
            onChange={(value) => handleChangeField("email", value)}
            onCheck={() => void handleCheckDuplicate("email")}
          />

          <DuplicateField
            id="signup-nickname"
            label="닉네임"
            type="text"
            autoComplete="nickname"
            placeholder="2~12자"
            value={form.nickname}
            isValid={isNicknameValid}
            isChecking={duplicateCheck.nickname.isChecking}
            isAvailable={duplicateCheck.nickname.isAvailable}
            errorMessage="닉네임은 2자 이상 12자 이하로 입력해 주세요."
            onChange={(value) => handleChangeField("nickname", value)}
            onCheck={() => void handleCheckDuplicate("nickname")}
          />

          <div>
            <label htmlFor="signup-password" className={LABEL_CLASS}>
              비밀번호
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              aria-describedby="signup-password-hint"
              className={INPUT_CLASS}
              value={form.password}
              onChange={(event) =>
                handleChangeField("password", event.target.value)
              }
            />
            <p
              id="signup-password-hint"
              className={
                form.password.length > 0 && !isPasswordValid
                  ? ERROR_CLASS
                  : "mt-1.5 text-xs text-slate-500"
              }
            >
              영문 대·소문자, 숫자, 특수문자(!@#$%^&amp;*)를 모두 포함해 8자
              이상 입력해 주세요.
            </p>
          </div>

          <div>
            <label htmlFor="signup-password-confirm" className={LABEL_CLASS}>
              비밀번호 확인
            </label>
            <input
              id="signup-password-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="다시 입력"
              className={INPUT_CLASS}
              value={form.passwordConfirm}
              onChange={(event) =>
                handleChangeField("passwordConfirm", event.target.value)
              }
            />

            {form.passwordConfirm.length > 0 && !isPasswordConfirmValid && (
              <p className={ERROR_CLASS}>비밀번호가 일치하지 않아요.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || signupMutation.isPending}
            className={PRIMARY_BUTTON_CLASS}
          >
            {signupMutation.isPending ? "가입 중" : "가입하기"}
          </button>
        </fieldset>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        이미 계정이 있나요?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-600 underline underline-offset-2"
        >
          로그인
        </Link>
      </p>
    </AuthLayout>
  );
}
