// import React, {useEffect, useState} from 'react';
// import {Button, TextInput, View, Text} from 'react-native';
// import socket from './socket';

// const Chat = () => {
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     socket.on('message', msg => {
//       setMessages(prevMessages => [...prevMessages, msg]);
//     });

//     return () => {
//       socket.off('message');
//     };
//   }, []);

//   const sendMessage = message => {
//     socket.emit('message', {
//       content: message,
//       sender: 'user1',
//       receiver: 'user2',
//     }); // Replace with actual sender and receiver
//     setMessage('');
//   };

//   return (
//     <View>
//       {messages.map((msg, index) => (
//         <Text key={index}>{msg.content}</Text>
//       ))}
//       <TextInput
//         value={message}
//         onChangeText={setMessage}
//         placeholder="Type your message here..."
//       />
//       <Button title="Send" onPress={() => sendMessage(message)} />
//     </View>
//   );
// };

// export default Chat;
