import {SERVER_ADDRESS} from '@env';
import {StyleSheet, Text, View, Pressable, Image} from 'react-native';
import React, {useContext} from 'react';
import {UserType} from '../../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import API from '../config/API';

const FriendRequests = ({item, friendRequests, setFriendRequests}) => {
  const {userId, setUserId} = useContext(UserType);
  const navigation = useNavigation();
  const acceptRequest = async friendRequestId => {
    try {
      const response = await API.post(`/friend-request/accept`, {
        senderId: friendRequestId,
        recipientId: userId,
      });
      if (response.status === 200) {
        setFriendRequests(
          friendRequests.filter(response => response._id !== friendRequestId),
          navigation.navigate('Chats'),
        );
      }
    } catch (error) {
      console.log('error accepting request', error);
    }
  };
  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 10,
      }}>
      <Image
        style={{width: 50, height: 50, borderRadius: 25}}
        source={{uri: item.image}}
      />

      <Text style={{fontSize: 15, fontWeight: 'bold', marginLeft: 10, flex: 1}}>
        {item?.name} sent a friend request!
      </Text>

      <Pressable
        onPress={() => acceptRequest(item._id)}
        style={{backgroundColor: '#007BFF', padding: 10, borderRadius: 6}}>
        <Text style={{textAlign: 'center', color: 'white'}}>Accept</Text>
      </Pressable>
    </Pressable>
  );
};

export default FriendRequests;

const styles = StyleSheet.create({});
