import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { RootState } from "../redux/store";
import { setAuth } from "../redux/authSlice";
import axios from "axios";
import { useEffect } from "react";
import "../static/Nav.css";

export const Nav = () => {
  const auth = useSelector((state: RootState) => state.auth.value);
  const dispatch = useDispatch();
  const location = useLocation();
  const isSub = location.pathname === "/sub";

  // ✅ Check auth status on first load
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
    axios.defaults.headers.common["Authorization"] = "";
    dispatch(setAuth(false));
  };

  // ✅ Define links based on auth
  let links;
  if (auth) {
    links = (
      <div>
        <button className="btn btn-outline-primary" onClick={logout}>
          Logout
        </button>
      </div>
    );
  } else {
    links = !isSub && (
      <>
        <Link to="/login" className="btn btn-outline-primary">
          Login
        </Link>
        <Link to="/register" className="btn btn-primary">
          Register
        </Link>
      </>
    );
  }

  // ✅ Return JSX with injected links
  return (
    <div className="navbar-container">
      <header className="navbar-header">
        <div className="navbar-left">
          {!isSub && (
            <ul className="navbar-nav">
              <li>
                <Link to="/" className="nav-link">
                  <img
                    src="/logo.png"
                    style={{ height: "4vh", marginRight: "8px" }}
                  />
                   <span className="logo-text">SpeechConvert</span>
                </Link>
              </li>
            </ul>
          )}
        </div>
        <div className="navbar-right">{links}</div>
      </header>
    </div>
  );
};
