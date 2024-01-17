import {baseURL} from '../config/API';
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import React, {useEffect} from 'react';
import {TextInput, GestureHandlerRootView} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import {connectSocket} from '../components/Socket';
import * as Keychain from 'react-native-keychain';
import axios from 'axios';

let accessToken = null;

const LoginScreen = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
          const {username: userId, password: refreshToken} = credentials;

          // Access token not found or expired, get a new one using the refresh token
          const URL = `${baseURL}/users/token`;
          const response = await axios.post(URL, {
            refreshToken: refreshToken,
          });
          accessToken = response.data.accessToken;

          // Connect to the socket using socket.io and set the user online
          connectSocket(userId);

          navigation.replace('Home');
        } else {
          // Refresh token not found, show the login screen itself
        }
      } catch (error) {
        console.log('error', error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = () => {
    const user = {
      email: email,
      password: password,
    };
    const URL = `${baseURL}/users/login`;
    axios
      .post(URL, user)
      .then(async response => {
        accessToken = response.data.accessToken;
        const refreshToken = response.data.refreshToken;
        const userId = response.data.userId;
        await Keychain.setGenericPassword(userId.toString(), refreshToken);

        // Connect to the socket and set the user online
        connectSocket(userId);

        navigation.replace('Home');
      })
      .catch(error => {
        Alert.alert('Login Error', 'Invalid email or password');
        console.log('Login Error', error);
      });
  };
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'white',
          padding: 10,
          alignItems: 'center',
        }}>
        <KeyboardAvoidingView>
          <View
            style={{
              marginTop: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: '#75E6DA',
                fontSize: 17,
                fontWeight: 'bold',
              }}>
              Sign In
            </Text>
            <Text
              style={{
                fontSize: 17,
                fontWeight: 'bold',
                marginTop: 15,
              }}>
              Sign in to your account
            </Text>
          </View>
          <View
            style={{
              marginTop: 50,
            }}>
            <View>
              <Text style={{fontSize: 18, fontWeight: '600', color: 'grey'}}>
                Email
              </Text>

              <TextInput
                value={email}
                onChangeText={text => setEmail(text)}
                style={{
                  fontSize: email ? 18 : 18,
                  borderBottomColor: 'gray',
                  borderBottomWidth: 1,
                  marginVertical: 10,
                  width: 300,
                }}
                placeholderTextColor={'black'}
                placeholder="enter your Email"
              />
            </View>
            <View style={{marginTop: 10}}>
              <Text style={{fontSize: 18, fontWeight: '600', color: 'grey'}}>
                Password
              </Text>

              <TextInput
                value={password}
                onChangeText={text => setPassword(text)}
                secureTextEntry={true}
                style={{
                  fontSize: password ? 18 : 18,
                  borderBottomColor: 'gray',
                  borderBottomWidth: 1,
                  marginVertical: 10,
                  width: 300,
                }}
                placeholderTextColor={'black'}
                placeholder="enter your Password"
              />
            </View>
            <Pressable
              onPress={handleLogin}
              style={{
                width: 200,
                backgroundColor: '#75E6DA',
                padding: 15,
                marginTop: 50,
                marginLeft: 'auto',
                marginRight: 'auto',
                borderRadius: 6,
              }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                Login
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={{marginTop: 15}}>
              <Text style={{textAlign: 'center', color: 'gray', fontSize: 16}}>
                Don't have an account? Sign Up
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </GestureHandlerRootView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({});
