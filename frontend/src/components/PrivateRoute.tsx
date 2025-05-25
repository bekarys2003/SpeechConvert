import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../redux/store";

interface PrivateRouteProps {
  children: JSX.Element;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const auth = useSelector((state: RootState) => state.auth.value);

  if (!auth) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
