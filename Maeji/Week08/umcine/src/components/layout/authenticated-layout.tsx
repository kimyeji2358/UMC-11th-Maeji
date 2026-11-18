import { Navigate, Outlet } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth-store";

export function AuthenticatedLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
