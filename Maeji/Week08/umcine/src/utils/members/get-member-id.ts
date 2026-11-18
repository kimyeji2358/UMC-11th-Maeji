export function getMemberIdFromToken(accessToken: string | null) {
  if (!accessToken) return null;

  const payload = accessToken.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64)) as { sub?: string | number };
    const memberId = Number(claims.sub);

    return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
  } catch {
    return null;
  }
}
