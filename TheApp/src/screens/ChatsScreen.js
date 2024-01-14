import {StyleSheet, Text, View, ScrollView, Pressable} from 'react-native';
import React, {useContext, useEffect, useLayoutEffect} from 'react';
import {UserType} from '../../UserContext';
import {useNavigation} from '@react-navigation/native';
import UserChat from '../components/UserChat';
import Icon from 'react-native-vector-icons/Ionicons';
import API from '../config/API';

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
        const response = await API.get(`/conversations/${userId}`);
        if (response.status === 200) {
          setConversations(response.data);
        }
      } catch (error) {
        console.log('error fetching conversations list', error);
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
