import {SERVER_ADDRESS} from '@env';
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
import io from 'socket.io-client';
import * as ImagePicker from 'react-native-image-picker';

const ChatMessagesScreen = () => {
  const {userId} = useContext(UserType);
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const route = useRoute();
  const {conversationId, recipientId} = route.params;
  const [selectedImage, setSelectedImage] = React.useState('');
  const navigation = useNavigation();
  const [recipientData, setRecipientData] = React.useState();

  const [showEmojiSelector, setShowEmojiSelector] = React.useState(false);
  const handleEmojiPress = () => {
    setShowEmojiSelector(!showEmojiSelector);
  };

  useEffect(() => {
    const socket = io(`${SERVER_ADDRESS}`);

    socket.on('chat message', msg => {
      console.log('Received message from server', msg); // Log the received message
      // Update the state with the new message
      setMessages(prevMessages => [...prevMessages, msg]);
    });

    // Clean up the effect
    return () => socket.disconnect();
  }, []);

  const fetchMessages = async conversationId => {
    const token = await AsyncStorage.getItem('authToken');
    const URL = `${SERVER_ADDRESS}/messages/${conversationId}`;
    const response = await fetch(URL, {
      headers: {
        Authorization: `Bearer ${token}`, // replace with your JWT token
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching messages');
    }

    const messages = await response.json();
    setMessages(messages);
  };

  useEffect(() => {
    fetchMessages(conversationId);
  }, []);

  useEffect(() => {
    const fetchRecipientData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const URL2 = `${SERVER_ADDRESS}/user/${recipientId}`;
        const response = await fetch(URL2, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setRecipientData(data);
      } catch (error) {
        console.log('error fetching recipient data', error);
      }
    };

    fetchRecipientData();
  }, []);

  const handleSend = async () => {
    try {
      const formData = new FormData();
      formData.append('senderId', userId);
      formData.append('conversationId', conversationId);

      // if there's a selected image in state, send it
      if (selectedImage) {
        console.log('Sending image...', selectedImage); // Log when an image is being sent
        formData.append('messageType', 'image');
        formData.append('imageFile', {
          uri: selectedImage,
          name: 'image.jpg',
          type: 'image/jpeg',
        });
      } else {
        // Otherwise, it's a text message
        console.log('Sending text message...', message); // Log when a text message is being sent
        formData.append('messageType', 'text');
        formData.append('messageText', message);
      }

      const token = await AsyncStorage.getItem('authToken');
      const URL3 = `${SERVER_ADDRESS}/messages`;
      const response = await fetch(URL3, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const socket = io(`${SERVER_ADDRESS}`);
        socket.emit('chat message', {
          text: message,
          userId: userId,
          conversationId: conversationId,
        });

        // Pass conversationId to fetchMessages
        fetchMessages(conversationId).then(() => {
          setMessage('');
          setSelectedImage('');
        });
      }
    } catch (error) {
      console.log('error sending message', error);
    }
  };

  const formatTime = time => {
    const options = {hour: 'numeric', minute: 'numeric'};
    return new Date(time).toLocaleString([], options);
  };

  const pickImage = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 200,
        maxWidth: 200,
      },
      response => {
        console.log(response);
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          const source = {uri: response.assets[0].uri};
          console.log(source);
          setSelectedImage(response.assets[0].uri); // only set the selected image URI to state
        }
      },
    );
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

  // console.log('messages', messages); // for debugging purposes
  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: '#f0f0f0'}}>
      <ScrollView>
        {messages.map((item, index) => {
          if (item.text) {
            return (
              <Pressable
                key={index}
                style={[
                  item?.userId?._id === userId
                    ? {
                        alignSelf: 'flex-end',
                        backgroundColor: '#D0E7F9',
                        padding: 8,
                        maxWidth: '60%',
                        borderRadius: 7,
                        margin: 10,
                      }
                    : {
                        alignSelf: 'flex-start',
                        backgroundColor: 'white',
                        padding: 8,
                        maxWidth: '60%',
                        borderRadius: 7,
                        margin: 10,
                      },
                ]}>
                <Text style={{fontSize: 13, textAlign: 'left'}}>
                  {item?.text}
                </Text>
                <Text
                  style={{
                    textAlign: 'right',
                    fontSize: 9,
                    color: 'gray',
                    marginTop: 5,
                  }}>
                  {formatTime(item.timestamp)}
                </Text>
              </Pressable>
            );
          }

          if (item.images && item.images.length > 0) {
            return (
              <Pressable
                key={index}
                style={[
                  item?.userId?._id === userId
                    ? {
                        alignSelf: 'flex-end',
                        backgroundColor: '#D0E7F9',
                        padding: 8,
                        maxWidth: '60%',
                        borderRadius: 7,
                        margin: 10,
                      }
                    : {
                        alignSelf: 'flex-start',
                        backgroundColor: 'white',
                        padding: 8,
                        maxWidth: '60%',
                        borderRadius: 7,
                        margin: 10,
                      },
                ]}>
                <View>
                  <Image
                    style={{
                      width: 200,
                      height: 200,
                      resizeMode: 'cover',
                    }}
                    source={{uri: item?.images[0]}}
                  />
                  <Text
                    style={{
                      textAlign: 'right',
                      fontSize: 9,
                      color: 'gray',
                      position: 'absolute',
                      marginTop: 5,
                      right: 10,
                      bottom: 7,
                    }}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </Pressable>
            );
          }
        })}
      </ScrollView>

      {/* Image to be sent */}
      {selectedImage ? (
        <View style={{alignItems: 'center', margin: 10}}>
          <Image
            source={{uri: selectedImage}}
            style={{width: 200, height: 200}}
          />
          <Text>Selected Image</Text>
          <Pressable onPress={() => setSelectedImage('')}>
            <Text>Remove Image</Text>
          </Pressable>
        </View>
      ) : null}

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
          <FontAwesome
            onPress={pickImage}
            name="camera"
            size={24}
            color="gray"
          />
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
