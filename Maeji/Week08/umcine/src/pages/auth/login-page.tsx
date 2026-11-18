import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../components/auth/form-styles";
import { AuthLayout } from "../../components/layout/auth-layout";
import { useLoginMutation } from "../../hooks/use-login-mutation";
import { EMAIL_REGEX } from "../../utils/members/validation";

const DEFAULT_FORM = {
  email: "",
  password: "",
};

type FormKey = keyof typeof DEFAULT_FORM;

export function LoginPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const loginMutation = useLoginMutation();

  const isEmailValid = EMAIL_REGEX.test(form.email.trim());
  const canSubmit = isEmailValid && form.password.length > 0;

  function handleChangeField(key: FormKey, value: string) {
    setForm((previousForm) => ({ ...previousForm, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || loginMutation.isPending) return;
    loginMutation.mutate({
      email: form.email.trim(),
      password: form.password,
    });
  }

  return (
    <AuthLayout title="로그인">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="login-email" className={LABEL_CLASS}>
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className={INPUT_CLASS}
            value={form.email}
            onChange={(event) => handleChangeField("email", event.target.value)}
          />

          {form.email.length > 0 && !isEmailValid && (
            <p className={ERROR_CLASS}>올바른 이메일 형식으로 입력해 주세요.</p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className={LABEL_CLASS}>
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호 입력"
            className={INPUT_CLASS}
            value={form.password}
            onChange={(event) =>
              handleChangeField("password", event.target.value)
            }
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loginMutation.isPending}
          className={PRIMARY_BUTTON_CLASS}
        >
          {loginMutation.isPending ? "로그인 중" : "로그인"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        아직 계정이 없나요?{" "}
        <Link
          to="/signup"
          className="font-semibold text-blue-600 underline underline-offset-2"
        >
          회원가입
        </Link>
      </p>
    </AuthLayout>
  );
}
