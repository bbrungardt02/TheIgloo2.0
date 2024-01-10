import {SERVER_ADDRESS} from '@env';
import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useContext} from 'react';
import {UserType} from '../../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import FriendRequests from '../components/FriendRequests';

const FriendsScreen = () => {
  const {userId, setUserId} = useContext(UserType);
  const [friendRequests, setFriendRequests] = React.useState([]);

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const URL = `${SERVER_ADDRESS}/friend-requests/${userId}`;
      const response = await axios.get(URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        const friendRequestsData = response.data.map(friendRequest => ({
          _id: friendRequest._id,
          name: friendRequest.name,
          email: friendRequest.email,
          image: friendRequest.image,
        }));
        setFriendRequests(friendRequestsData);
      }
    } catch (error) {
      console.log('error fetching friend requests', error);
    }
  };

  console.log('friendRequests', friendRequests); // for debugging purposes
  return (
    <View style={{padding: 10, marginHorizontal: 12}}>
      {friendRequests.length > 0 && <Text>Friend Requests</Text>}

      {friendRequests.map((item, index) => (
        <FriendRequests
          key={index}
          item={item}
          friendRequests={friendRequests}
          setFriendRequests={setFriendRequests}
        />
      ))}
    </View>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({});
