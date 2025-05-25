import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

import { RootState } from "../redux/store";
import { setAuth } from "../redux/authSlice";
import "../static/Nav.css";

export const Nav = () => {
  const auth = useSelector((state: RootState) => state.auth.value);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        await axios.get("user");
        dispatch(setAuth(true));
      } catch {
        dispatch(setAuth(false));
      }
    })();
  }, [dispatch]);

  const logout = async () => {
    await axios.post("logout");
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    dispatch(setAuth(false));
    window.location.href = "/login";
  };

  const renderAuthLinks = () => {
    if (auth) {
      return (
        <button className="btn btn-outline-primary" onClick={logout}>
          Logout
        </button>
      );
    }

    return (
      <>
        <Link to="/login" className="btn btn-outline-primary">
          Login
        </Link>
        <Link to="/register" className="btn btn-primary">
          Register
        </Link>
      </>
    );
  };

  return (
    <div className="navbar-container">
      <header className="navbar-header">
        <div className="navbar-left">
          <ul className="navbar-nav">
            <li>
              <Link to="/" className="nav-link">
                <img
                  src="/logo.png"
                  alt="SpeechConvert logo"
                  style={{ height: "4vh", marginRight: "8px" }}
                />
                <span className="logo-text">SpeechConvert</span>
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-right">{renderAuthLinks()}</div>
      </header>
    </div>
  );
};
