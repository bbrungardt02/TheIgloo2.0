import {SERVER_ADDRESS} from '@env';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {
  TextInput,
  GestureHandlerRootView,
  ScrollView,
} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';

const RegisterScreen = () => {
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [image, setImage] = useState('');
  const navigation = useNavigation();
  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }
    const user = {
      name: name,
      email: email,
      password: password,
      image: image,
    };
    // send a POST request to the backend API to register the user
    try {
      const URL = `${SERVER_ADDRESS}/register`;
      const response = await axios.post(URL, user);
      console.log(response);
      Alert.alert('Success', 'You have successfully registered!');
      setName('');
      setEmail('');
      setPassword('');
      setImage('');
    } catch (error) {
      Alert.alert('Error', error.message);
      console.log('registration failed', error);
    }
  };
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ScrollView>
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
                Register
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: 'bold',
                  marginTop: 15,
                }}>
                Register to your account
              </Text>
            </View>

            <View
              style={{
                marginTop: 50,
              }}>
              <View style={{marginTop: 10}}>
                <Text style={{fontSize: 18, fontWeight: '600', color: 'grey'}}>
                  Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={text => setName(text)}
                  style={{
                    fontSize: name ? 18 : 18,
                    borderBottomColor: 'gray',
                    borderBottomWidth: 1,
                    marginVertical: 10,
                    width: 300,
                  }}
                  placeholderTextColor={'black'}
                  placeholder="enter your name"
                />
              </View>

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
                  placeholder="enter your email"
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
                  placeholder="enter password"
                />
              </View>
              <View style={{marginTop: 10}}>
                <Text style={{fontSize: 18, fontWeight: '600', color: 'grey'}}>
                  Confirm Password
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={text => setConfirmPassword(text)}
                  secureTextEntry={true}
                  style={{
                    fontSize: confirmPassword ? 18 : 18,
                    borderBottomColor: 'gray',
                    borderBottomWidth: 1,
                    marginVertical: 10,
                    width: 300,
                  }}
                  placeholderTextColor={'black'}
                  placeholder="confirm password"
                />
              </View>

              <View style={{marginTop: 10}}>
                <Text style={{fontSize: 18, fontWeight: '600', color: 'grey'}}>
                  Image
                </Text>
                <TextInput
                  value={image}
                  onChangeText={text => setImage(text)}
                  style={{
                    fontSize: image ? 18 : 18,
                    borderBottomColor: 'gray',
                    borderBottomWidth: 1,
                    marginVertical: 10,
                    width: 300,
                  }}
                  placeholderTextColor={'black'}
                  placeholder="enter your image"
                />
              </View>

              <Pressable
                onPress={handleRegister}
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
                  Register
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.goBack()}
                style={{marginTop: 15}}>
                <Text
                  style={{textAlign: 'center', color: 'gray', fontSize: 16}}>
                  Already have an account? Sign In
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({});
