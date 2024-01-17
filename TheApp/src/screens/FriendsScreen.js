import {StyleSheet, Text, View, Alert} from 'react-native';
import React, {useEffect, useContext, useLayoutEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Keychain from 'react-native-keychain';
import {UserType} from '../../UserContext';
import FriendRequests from '../components/FriendRequests';
import API from '../config/API';

const FriendsScreen = () => {
  const navigation = useNavigation();
  const {userId, setUserId} = useContext(UserType);
  const [friendRequests, setFriendRequests] = React.useState([]);

  const logout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {
        text: 'Confirm',
        onPress: async () => {
          // Clear user credentials from Keychain
          await Keychain.resetGenericPassword();
          navigation.reset({
            index: 0,
            routes: [{name: 'Login'}],
          });
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcons onPress={logout} name="logout" size={24} color="black" />
      ),
    });
  }, []);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await API.get(`/friends/requests/${userId}`);
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

    fetchFriendRequests();
  }, []);

  // console.log('friendRequests', friendRequests); // for debugging purposes
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
