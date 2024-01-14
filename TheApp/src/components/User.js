import {StyleSheet, Text, View, Pressable, Image} from 'react-native';
import React, {useContext} from 'react';
import {UserType} from '../../UserContext';
import API from '../config/API';

const User = ({item}) => {
  const {userId, setUserId} = useContext(UserType);
  const [requestSent, setRequestSent] = React.useState(false);
  const sendFriendRequest = async (currentUserId, selectedUserId) => {
    try {
      const response = await API.post(`/friend-request`, {
        currentUserId,
        selectedUserId,
      });
      if (response.status === 200) {
        setRequestSent(true);
      }
    } catch (error) {
      console.log('error sending request', error);
    }
  };

  return (
    <Pressable
      style={{flexDirection: 'row', alignItems: 'center', marginVertical: 10}}>
      <View>
        <Image
          source={{uri: item.image}}
          style={{width: 50, height: 50, borderRadius: 25, resizeMode: 'cover'}}
        />
      </View>

      <View style={{marginLeft: 12, flex: 1}}>
        <Text style={{fontWeight: 'bold'}}>{item?.name}</Text>
        <Text style={{marginTop: 4, color: 'gray'}}>{item?.email}</Text>
      </View>

      <Pressable
        onPress={() => sendFriendRequest(userId, item._id)}
        style={{
          backgroundColor: '#69D2E7',
          padding: 10,
          borderRadius: 6,
          width: 105,
        }}>
        <Text style={{textAlign: 'center', color: 'white', fontSize: 13}}>
          Add Friend
        </Text>
      </Pressable>
    </Pressable>
  );
};

export default User;

const styles = StyleSheet.create({});
