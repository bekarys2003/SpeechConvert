import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { setAuth } from "../redux/authSlice";
import { RootState } from "../redux/store";
import "../static/Nav.css";

type RefreshResponse = {
  token: string;
};

export const Nav = () => {
  const auth = useSelector((state: RootState) => state.auth.value);
  const dispatch = useDispatch();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await axios.get("user");
        dispatch(setAuth(true));
      } catch {
        try {
          const response = await axios.post<RefreshResponse>("refresh", {}, { withCredentials: true });
          axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
          await axios.get("user");
          dispatch(setAuth(true));
        } catch {
          dispatch(setAuth(false));
        }
      }
      setAuthChecked(true);
    })();
  }, [dispatch]);

  const logout = async () => {
    await axios.post("logout", {}, { withCredentials: true });
    axios.defaults.headers.common["Authorization"] = "";
    dispatch(setAuth(false));
  };

  if (!authChecked) return null;

  const isSub = location.pathname === "/sub";

  return (
    <div className="navbar-container">
      <header className="navbar-header">
        <div className="navbar-left">
          {!isSub && (
            <ul className="navbar-nav">
              <li>
                <Link to="/" className="nav-link">Home</Link>
              </li>
            </ul>
          )}
        </div>
        <div className="navbar-right">
          {auth ? (
            <Link to="/login" className="btn btn-outline-primary" onClick={logout}>
              Logout
            </Link>
          ) : (
            !isSub && (
              <>
                <Link to="/login" className="btn btn-outline-primary">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )
          )}
        </div>
      </header>
    </div>
  );
};
