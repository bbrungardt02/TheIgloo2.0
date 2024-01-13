import {SERVER_ADDRESS} from '@env';
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
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connectSocket} from '../components/Socket';

const LoginScreen = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userId = await AsyncStorage.getItem('userId');

        if (token && userId) {
          // Connect to the socket and set the user online
          connectSocket(userId);

          navigation.replace('Home');
        } else {
          // token not found , show the login screen itself
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
    // console.log(`server address, ${SERVER_ADDRESS}`); // for debugging EC2 instance network connection ( had to access to the address inside p list for iOS)
    const URL = `${SERVER_ADDRESS}/login`;
    // console.log('SERVER URL', URL); // same thing here
    axios
      .post(URL, user)
      .then(response => {
        // console.log(response);  // for debugging purposes
        const token = response.data.token;
        const userId = response.data.userId;
        AsyncStorage.setItem('authToken', token);
        AsyncStorage.setItem('userId', userId.toString());

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
