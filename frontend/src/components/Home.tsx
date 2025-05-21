import axios from "axios";
import { useEffect, useState } from "react"
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setAuth } from "../redux/authSlice";
import { RootState } from "../redux/store";


type User = {
    first_name: string;
    last_name: string;
};

export const Home = () => {
    const dispatch = useDispatch();
    const [message, setMessage] = useState('');
    const auth = useSelector((state: RootState) => state.auth.value);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get<User>('user');

                setMessage(`Hi ${data.first_name} ${data.last_name}`);
                dispatch(setAuth(true));
            } catch (error) {
                setMessage('You are not logged in');
                dispatch(setAuth(false));
            }
        })()
    }, []);

    return <div className="container mt-5 text-center">
        <h3>
            {auth ? message : 'You are not logged in'}
        </h3>
    </div>

}