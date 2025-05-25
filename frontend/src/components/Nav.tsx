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
    window.location.href = "/login"; // ✅ full reload to prevent token reuse
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
  } else if(!auth){
    links =(
      <>
        <Link to="/login" className="btn btn-outline-primary">
          Login
        </Link>
        <Link to="/register" className="btn btn-primary">
          Register
        </Link>
      </>
    );
  }else {
    // ✅ Authenticated but not on /sub — show nothing
    links = null;
  }

  // ✅ Return JSX with injected links
  return (
    <div className="navbar-container">
      <header className="navbar-header">
        <div className="navbar-left">
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

        </div>
        <div className="navbar-right">{links}</div>
      </header>
    </div>
  );
};
