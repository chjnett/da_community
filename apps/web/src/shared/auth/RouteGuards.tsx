import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenStorage } from "../api/tokenStorage";

function hasSession() {
  return Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());
}

export const AuthGuard: React.FC = () => {
  return <Outlet />;
};

export const GuestGuard: React.FC = () => {
  return <Outlet />;
};

