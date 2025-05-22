import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { setAuth } from "../redux/authSlice";
import { RootState } from "../redux/store";


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
      setAuthChecked(true); // ✅ done checking
    })();
  }, [dispatch]);

  const logout = async () => {
    await axios.post("logout", {}, { withCredentials: true });
    axios.defaults.headers.common["Authorization"] = "";
    dispatch(setAuth(false));
  };

  // ✅ Prevent flicker: show nothing until auth check is complete
  if (!authChecked) return null;

  const isSub = location.pathname === "/sub";

  return (
    <div className="container">
      <header className="d-flex flex-wrap align-items-center justify-content-between py-3 mb-4 border-bottom">
        <div className="col-md-3 mb-2 mb-md-0">
          {!isSub && (
            <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0">
              <li>
                <Link to="/" className="nav-link px-2">Home</Link>
              </li>
            </ul>
          )}
        </div>

        <div className="col-md-3 text-end">
          {auth ? (
            <Link to="/login" className="btn btn-outline-primary me-2" onClick={logout}>
              Logout
            </Link>
          ) : (
            !isSub && (
              <>
                <Link to="/login" className="btn btn-outline-primary me-2">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )
          )}
        </div>
      </header>
    </div>
  );
};
