import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import {SERVER_ADDRESS} from '@env';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';

let accessToken = null;

// Create an Axios instance
const API = axios.create({
  baseURL: SERVER_ADDRESS,
});

// Add a request interceptor
API.interceptors.request.use(
  async config => {
    // If access token is null, get it from Keychain
    if (!accessToken) {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        const {username: userId, password: refreshToken} = credentials;

        console.log('Refresh token:', refreshToken); // Log the refresh token

        // Access token not found or expired, get a new one using the refresh token
        try {
          const response = await axios.post(`${SERVER_ADDRESS}/token`, {
            refreshToken: refreshToken,
          });
          accessToken = response.data.accessToken;

          console.log('New access token:', accessToken); // Log the new access token
        } catch (error) {
          if (error.response && error.response.status === 401) {
            // Refresh token is invalid or expired, clear the stored credentials
            await Keychain.resetGenericPassword();
            Alert.alert('Session expired', 'Please login again.'); // Show an alert to the user
            // TODO: Redirect the user to the login screen
          } else {
            console.log('Error getting access token:', error.message);
          }
        }
      }
    }

    // Add the access token to the request header
    config.headers.Authorization = `Bearer ${accessToken}`;

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export default API;
