import { sign, verify } from 'jsonwebtoken'
//
import axios from './axios'

// ----------------------------------------------------------------------

const isValidToken = (accessToken) => {
  if (!accessToken) {
    return false
  }

  return accessToken.length === 40
}

//  const handleTokenExpired = (exp) => {
//   let expiredTimer;

//   window.clearTimeout(expiredTimer);
//   const currentTime = Date.now();
//   const timeLeft = exp * 1000 - currentTime;
//   console.log(timeLeft);
//   expiredTimer = window.setTimeout(() => {
//     console.log('expired');
//     // You can do what ever you want here, like show a notification
//   }, timeLeft);
// };

const setSession = (accessToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken)
    axios.defaults.headers.common.Authorization = `Token ${accessToken}`
    // This function below will handle when token is expired
    // const { exp } = jwtDecode(accessToken);
    // handleTokenExpired(exp);
  } else {
    localStorage.removeItem('accessToken')
    delete axios.defaults.headers.common.Authorization
  }
}

export { isValidToken, setSession, verify, sign }