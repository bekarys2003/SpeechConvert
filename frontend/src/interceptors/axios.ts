import axios from "axios";

type RefreshResponse = {
    token: string;
};

axios.defaults.baseURL = 'http://127.0.0.1:8000/api/'
axios.defaults.withCredentials = true;

let refresh = false;

axios.interceptors.response.use(resp => resp, async error => {
    if (error.response.status === 403 && !refresh) {
        refresh = true;
        const response = await axios.post<RefreshResponse>('refresh', {});
        if(response.status === 200){
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

            return axios(error.config);

        }
    }
    refresh = false;
    return error;
});