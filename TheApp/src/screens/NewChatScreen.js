import {SERVER_ADDRESS} from '@env';
import {StyleSheet, Text, View, Button, TextInput} from 'react-native';
import React, {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';

const NewChatScreen = () => {
  const [recipientId, setRecipientId] = useState('');
  const [friends, setFriends] = React.useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');

  const createNewChat = async () => {
    try {
      const senderId = await AsyncStorage.getItem('userId');
      console.log('SenderId:', senderId); // Add this line
      console.log('RecipientId:', recipientId); // Add this line
      const response = await fetch(`${SERVER_ADDRESS}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          senderId,
          recipientId,
        }),
      });

      const data = await response.json();
      console.log('Fetch response:', data); // Add this line

      if (response.ok) {
        console.log('New chat created', data);
      } else {
        console.log('Failed to create new chat', data);
      }
    } catch (error) {
      console.log('Error creating new chat', error);
    }
  };

  useEffect(() => {
    const friendsList = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userId = await AsyncStorage.getItem('userId');
        const response = await fetch(`${SERVER_ADDRESS}/friends/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setFriends(data);
          console.log('Friends list:', data); // Add this line
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
