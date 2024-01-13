import {SERVER_ADDRESS} from '@env';
import {StyleSheet, Text, View, ScrollView, Pressable} from 'react-native';
import React, {useContext, useEffect, useLayoutEffect} from 'react';
import {UserType} from '../../UserContext';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserChat from '../components/UserChat';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatsScreen = () => {
  const [conversations, setConversations] = React.useState([]);
  const {userId, setUserId} = useContext(UserType);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Icon
          name="add-circle-outline"
          size={30}
          color="#000"
          style={{marginRight: 10}}
          onPress={() => {
            navigation.navigate('NewChat');
          }}
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const conversationsList = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const URL = `${SERVER_ADDRESS}/conversations/${userId}`;
        const response = await fetch(URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setConversations(data);
        }
      } catch (error) {
        console.log('error fetching friends list', error);
      }
    };
    conversationsList();
  }, []);

  // console.log('friends', friends); // for debugging purposes
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {conversations.map((item, index) => (
        <Pressable
          key={index}
          onPress={() => {
            console.log('Conversation ID:', item._id);
            console.log('Users in conversation:', item.users);
          }}>
          <UserChat item={item} />
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({});
