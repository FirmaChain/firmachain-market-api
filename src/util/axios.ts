import Axios from 'axios';

function createAxios(url: string) {
  try {
    return Axios.create({
      baseURL: url,
      headers: {
        Accept: 'application/json'
      },
      timeout: 5000
    });
  }
  catch (e) {
    console.log(e);
  }
}

export async function getAxios(url: string, path: string) {
  const _axios = createAxios(url);
  return await _axios.get(path);
}