import { useState } from "react";

export function MemberApiPanel() {
  const [nickname, setNickname] = useState("수현");
  const [email, setEmail] = useState("noco@umc.com");
  const [memberId, setMemberId] = useState("1");

  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function request(path: string) {
    setIsLoading(true);
    setResult("");

    try {
      const response = await fetch(`http://localhost:3000${path}`);

      const data: unknown = await response.json();

      setResult(`HTTP ${response.status}\n${JSON.stringify(data, null, 2)}`);

      if (!response.ok) {
        console.error("API 오류 응답:", response.status, data);
      }
    } catch (error) {
      console.error(error);
      setResult("요청에 실패했어요. Console과 Network를 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  const buttonClass = "rounded bg-[#f42b45] px-4 py-2 disabled:opacity-50";

  const inputClass =
    "min-w-0 rounded border border-[#555] bg-[#252525] px-3 py-2";

  return (
    <section className="my-10 space-y-4 rounded-xl bg-[#1b1b1b] p-6 text-white">
      <h2 className="text-xl font-bold">회원·평점 API 확인</h2>

      <div className="flex flex-wrap gap-3">
        <input
          aria-label="닉네임"
          className={inputClass}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />

        <button
          className={buttonClass}
          disabled={isLoading || !nickname.trim()}
          onClick={() =>
            request(`/members/nickname/${encodeURIComponent(nickname.trim())}`)
          }
        >
          닉네임 중복 확인
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          aria-label="이메일"
          className={inputClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button
          className={buttonClass}
          disabled={isLoading || !email.trim()}
          onClick={() =>
            request(`/members/email/${encodeURIComponent(email.trim())}`)
          }
        >
          이메일 중복 확인
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          aria-label="회원 번호"
          className={inputClass}
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
        />

        <button
          className={buttonClass}
          disabled={isLoading || !memberId.trim()}
          onClick={() =>
            request(`/members/${encodeURIComponent(memberId.trim())}/ratings`)
          }
        >
          회원 평점 조회
        </button>
      </div>

      {isLoading && <p>요청 중이에요.</p>}

      <pre className="overflow-auto whitespace-pre-wrap">{result}</pre>
    </section>
  );
}
