import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import React, {useContext, useEffect, useLayoutEffect} from 'react';
import {UserType} from '../../UserContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import IonIcons from 'react-native-vector-icons/Ionicons';
import EmojiSelector from 'react-native-emoji-selector';
import {useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const ChatMessagesScreen = () => {
  const {userId} = useContext(UserType);
  const [message, setMessage] = React.useState('');
  const route = useRoute();
  const {recipientId} = route.params;
  const [selectedImage, setSelectedImage] = React.useState('');
  const navigation = useNavigation();
  const [recipientData, setRecipientData] = React.useState();

  const [showEmojiSelector, setShowEmojiSelector] = React.useState(false);
  const handleEmojiPress = () => {
    setShowEmojiSelector(!showEmojiSelector);
  };

  useEffect(() => {
    const fetchRecipientData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(
          `http://localhost:8000/user/${recipientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        setRecipientData(data);
      } catch (error) {
        console.log('error fetching recipient data', error);
      }
    };

    fetchRecipientData();
  }, []);

  const handleSend = async (messageType, imageUri) => {
    try {
      const formData = new FormData();
      formData.append('senderId', userId);
      formData.append('recipientId', recipientId);

      // if the message type is image or text
      if (messageType === 'image') {
        formData.append('messageType', 'image');
        formData.append('imageFile', {
          uri: imageUri,
          name: 'image.jpg',
          type: 'image/jpeg',
        });
      } else {
        formData.append('messageType', 'text');
        formData.append('messageText', message);
      }

      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setMessage('');
        setSelectedImage('');
      }
    } catch (error) {
      console.log('error sending message', error);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <IonIcons
            onPress={() => navigation.goBack()}
            name="arrow-back"
            size={24}
            color="black"
          />

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                resizeMode: 'cover',
              }}
              source={{uri: recipientData?.image}}
            />
            <Text style={{marginLeft: 5, fontSize: 15, fontWeight: 'bold'}}>
              {recipientData?.name}
            </Text>
          </View>
        </View>
      ),
    });
  }, [recipientData]);

  console.log('recipientData', recipientData); // for debugging purposes
  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: '#f0f0f0'}}>
      <ScrollView>{/* chat messages go here */}</ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: 'dddddd',
          marginBottom: showEmojiSelector ? 0 : 25,
        }}>
        <MaterialIcons
          onPress={handleEmojiPress}
          style={{marginRight: 5}}
          name="emoji-emotions"
          size={24}
          color="gray"
        />
        <TextInput
          value={message}
          onChangeText={text => setMessage(text)}
          style={{
            flex: 1,
            height: 40,
            borderWidth: 1,
            borderColor: '#dddddd',
            borderRadius: 20,
            paddingHorizontal: 10,
          }}
          placeholder="Igloo Message"
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            marginHorizontal: 8,
          }}>
          <FontAwesome name="camera" size={24} color="gray" />
          <Entypo name="mic" size={24} color="gray" />
        </View>

        <Pressable
          onPress={() => handleSend('text')}
          style={{
            backgroundColor: '#007bff',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 20,
          }}>
          <Text style={{color: 'white', fontWeight: 'bold'}}>Send</Text>
        </Pressable>
      </View>

      {showEmojiSelector && (
        <EmojiSelector
          onEmojiSelected={emoji => {
            setMessage(prevMessage => prevMessage + emoji);
          }}
          style={{
            height: 250,
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default ChatMessagesScreen;

const styles = StyleSheet.create({});
