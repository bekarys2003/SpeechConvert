import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom"
import { setAuth } from "../redux/authSlice";
import { RootState } from "../redux/store";




export const Nav = () => {
    const auth = useSelector((state: RootState) => state.auth.value);
    const dispatch = useDispatch();

    const logout = async () => {
        await axios.post('logout', {}, {withCredentials:true});
        axios.defaults.headers.common['Authorization'] = '';
        dispatch(setAuth(false));
    }

    let links;


    if (auth){
        links = <div className="col-md-3 text-end">
            <Link to='/login' className="btn btn-outline-primary me-2"
                onClick={logout}
            >Logout</Link>
        </div>
    }else {
        links = <div className="col-md-3 text-end">
            <Link to='/login' className="btn btn-outline-primary me-2">Login</Link>
            <Link to='/register' className="btn btn-primary">Register</Link>
        </div>
    }


    return (
    <div className="container">
        <header className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3 mb-4 border-bottom">
            <div className="col-md-3 mb-2 mb-md-0">
                <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0">
                    <li><Link to="/" className="nav-link px-2">Home</Link></li>
                </ul>
            </div>
                <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0">
                    <li><a href="#" className="nav-link px-2">Home</a></li>
                </ul>
            {links}
        </header>
    </div>
    )
}

