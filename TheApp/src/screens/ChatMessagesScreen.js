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
import React, {useContext, useEffect, useLayoutEffect, useRef} from 'react';
import {UserType} from '../../UserContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import IonIcons from 'react-native-vector-icons/Ionicons';
import EmojiSelector from 'react-native-emoji-selector';
import {useRoute} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import * as ImagePicker from 'react-native-image-picker';
import {
  joinConversation,
  sendMessage,
  onMessageReceived,
  leaveConversation,
} from '../components/Socket';
import API from '../config/API';

const ChatMessagesScreen = () => {
  const {userId} = useContext(UserType);
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const route = useRoute();
  const {conversationId, recipientId} = route.params;
  const [selectedImage, setSelectedImage] = React.useState('');
  const navigation = useNavigation();
  const [recipientData, setRecipientData] = React.useState();
  const isJoined = React.useRef(false);

  const [showEmojiSelector, setShowEmojiSelector] = React.useState(false);
  const handleEmojiPress = () => {
    setShowEmojiSelector(!showEmojiSelector);
  };

  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated: false});
    }
  };

  const handleContentSizeChange = () => {
    scrollToBottom();
  };

  useEffect(() => {
    if (!isJoined.current) {
      // Access the current value of the ref
      joinConversation(conversationId);
      isJoined.current = true; // Update the ref
    }

    // Clean up the effect when the component unmounts
    return () => {
      leaveConversation(conversationId);
      isJoined.current = false; // Reset the ref
    };
  }, [conversationId]); // Remove isJoined from the dependency array

  const fetchMessages = async conversationId => {
    try {
      const response = await API.get(`/messages/${conversationId}`);
      if (response.status === 200) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error fetching messages', error);
    }
  };

  useEffect(() => {
    fetchMessages(conversationId);
  }, []);

  useEffect(() => {
    onMessageReceived(message => {
      setMessages(prevMessages => [...prevMessages, message]);
    });
  }, []);

  useEffect(() => {
    const fetchRecipientData = async () => {
      try {
        const response = await API.get(`/user/${recipientId}`);
        if (response.status === 200) {
          setRecipientData(response.data);
        }
      } catch (error) {
        console.log('error fetching recipient data', error);
      }
    };

    fetchRecipientData();
  }, []);

  const handleSend = async () => {
    // If message is an empty string, return immediately
    if (!message.trim()) {
      return;
    }

    try {
      const newMessage = {
        conversationId: conversationId,
        userId: {
          _id: userId,
        },
        text: message,
        timestamp: new Date().toISOString(),
      };

      sendMessage(newMessage);
      // Clear the message input
      setMessage('');
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

  // deletes all messages in the conversation for both users, used to clean database up for testing

  const deleteMessages = async () => {
    try {
      const response = await API.delete(`/messages/${conversationId}`);
      if (response.status === 200) {
        console.log(response.data.message);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting messages', error);
    }
  };

  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: '#f0f0f0'}}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{flexGrow: 1}}
        onContentSizeChange={handleContentSizeChange}>
        <Pressable onPress={deleteMessages}>
          <Text>Delete All Messages</Text>
        </Pressable>
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
                <Text style={{fontSize: 10, color: 'gray'}}>
                  Sent by: {item?.userId?._id}
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
          onPress={() => handleSend()}
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
