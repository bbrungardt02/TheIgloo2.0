import {StyleSheet, Text, View, ScrollView, Pressable} from 'react-native';
import React, {useContext, useEffect} from 'react';
import {UserType} from '../../UserContext';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserChat from '../components/UserChat';

const ChatsScreen = () => {
  const [friends, setFriends] = React.useState([]);
  const {userId, setUserId} = useContext(UserType);
  const navigation = useNavigation();

  useEffect(() => {
    const friendsList = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(
          `http://localhost:8000/friends/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (response.ok) {
          setFriends(data);
        }
      } catch (error) {
        console.log('error fetching friends list', error);
      }
    };
    friendsList();
  }, []);

  console.log('friends', friends); // for debugging purposes
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Pressable>
        {friends.map((item, index) => (
          <UserChat key={index} item={item} />
        ))}
      </Pressable>
    </ScrollView>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({});
