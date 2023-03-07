import Axios from 'axios';

function createAxios(url: string) {
  try {
    return Axios.create({
      baseURL: url,
      headers: {
        Accept: 'application/json'
      },
      timeout: 10000
    });
  }
  catch (e) {
    throw e;
  }
}

export async function getAxios(url: string, path: string) {
  try {
    const _axios = createAxios(url);
    return await _axios.get(path);
  } catch (e) {
    throw e;
  }
}