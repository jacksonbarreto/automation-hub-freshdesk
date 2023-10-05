import axios from 'axios';
import { environment } from '../environments/environment';

export const FETCH_DATA = async (password: string) => {
    const response = await axios.post(`${environment.base_url}/start`, { password });

    return response.data;
};

export const GET_BACKGROUND_JOB = async () => {
    const response = await axios.get(`${environment.base_url}/background-job`);

    return response.data;
};

export const GET_FILTERED_WORDS = async () => {
    const response = await axios.get(`${environment.base_url}/filtered-words`);

    return response.data;
};

export const SET_BACKGROUND_JOB = async (state: boolean) => {
    const response = await axios.post(`${environment.base_url}/background-job`, { state });

    return response.data;
};

export const DELETE_WORD = async (word: string) => {
    const response = await axios.post(`${environment.base_url}/remove-word`, { word });

    return response.data;
};

export const ADD_WORD = async (word: string) => {
    const response = await axios.post(`${environment.base_url}/add-word`, { word });

    return response.data;
};

export async function WAIT(delayInMilliseconds: number): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve, delayInMilliseconds));
}