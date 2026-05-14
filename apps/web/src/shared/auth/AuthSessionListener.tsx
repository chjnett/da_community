import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthExpired } from "./authEvents";
import { useToast } from "../ui/toast/ToastProvider";
import { toastMessages } from "../ui/toast/toastMessages";
import { useUserStore } from "../../store/userStore";

export const AuthSessionListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    return onAuthExpired(() => {
      if (location.pathname !== "/login") {
        useUserStore.getState().clearUser(); // 스토어 비우기
        toast.error(toastMessages.auth.sessionExpired);
        navigate("/login", { replace: true });
      }
    });
  }, [location.pathname, navigate, toast]);

  return null;
};
