import React from 'react';
import {StatusBar} from 'react-native';
import {StyleSheet, Text, View, ImageBackground} from 'react-native';
import StackNavigator from './StackNavigator';
import {UserContext} from './UserContext';

function App() {
  return (
    <>
      {/* <StatusBar barStyle="dark-content" />
      <View style={styles.sectionContainer}></View>
      <View
        style={{
          flex: 1,
        }}>
        <View style={styles.sectionContainer}>
          <ImageBackground
            source={require('./src/images/igloo.jpeg')}
            style={styles.resizeLogo}
            resizeMode="center">
            <Text style={[styles.iglooTitle]}>The Igloo</Text>
            <Text style={[styles.sectionDescription]}>
              <Text style={styles.centerStyle}>Welcome to Igloo Messaging</Text>
            </Text>
          </ImageBackground>
        </View> */}
      <UserContext>
        <StackNavigator />
      </UserContext>
      {/* </View> */}
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  iglooTitle: {
    color: '#006064', // dark cyan color
    textShadowColor: '#FFFFFF', // white shadow
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 2,
    fontWeight: 'bold',
    fontSize: 30,
    textAlign: 'center',
  },
  resizeLogo: {
    textAlign: 'center',
    padding: 50,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
