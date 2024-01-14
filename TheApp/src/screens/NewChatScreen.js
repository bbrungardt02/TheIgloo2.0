import {StyleSheet, Text, View, Button, TextInput} from 'react-native';
import React, {useState, useEffect, useContext} from 'react';
import {Picker} from '@react-native-picker/picker';
import {useNavigation} from '@react-navigation/native';
import API from '../config/API';
import {UserType} from '../../UserContext';

const NewChatScreen = () => {
  const {userId, setUserId} = useContext(UserType);
  const [recipientId, setRecipientId] = useState('');
  const [friends, setFriends] = React.useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const navigation = useNavigation();

  const createNewChat = async () => {
    try {
      // const senderId = userId;
      const response = await API.post(`/conversation`, {
        senderId: userId,
        recipientIds: [recipientId],
      });

      if (response.status === 200) {
        console.log('New chat created', response.data);
        navigation.navigate('Chats', {
          conversationId: response.data._id,
        });
      } else {
        console.log('Failed to create new chat', response.data);
      }
    } catch (error) {
      console.log('Error creating new chat', error);
    }
  };

  useEffect(() => {
    const friendsList = async () => {
      try {
        const response = await API.get(`/friends/${userId}`);

        if (response.status === 200) {
          setFriends(response.data);
          console.log('Friends list:', response.data);
        }
      } catch (error) {
        console.log('error fetching friends list', error);
      }
    };
    friendsList();
  }, []);

  return (
    <View>
      <Text>NewChatScreen</Text>
      <Picker
        selectedValue={selectedFriend}
        onValueChange={itemValue => {
          setSelectedFriend(itemValue);
          setRecipientId(itemValue);
          console.log('Selected friend:', itemValue);
        }}>
        {friends.map(friend => (
          <Picker.Item
            key={friend._id}
            label={friend.name}
            value={friend._id}
          />
        ))}
      </Picker>
      <Button title="Create New Chat" onPress={createNewChat} />
    </View>
  );
};

export default NewChatScreen;

const styles = StyleSheet.create({});
