import React, { Component } from 'react';
import {AppRegistry, FlatList, StyleSheet, Text, TextInput, View} from 'react-native';
import RCTAztecView from './AztecView';

class SimpleTextInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isShowingText: true, height: 200};
  }

  render() {
//let display = this.state.isShowingText ? this.props.my_text : ' ';
 let myMinHeight = Math.max(200, this.state.height);
    return (
          <View style={styles.container}>
            <FlatList
              data={[
                {key: 'Stefanos'},
                {key: 'Mario'},
                {key: 'Danilo'},
                {key: 'Maxime'},
                {key: 'Koke'},
                {key: 'Ondrej'},
                {key: 'Cate'},
              ]}
              renderItem={({item}) =>
              <RCTAztecView
                   {...this.props}
                   style={[styles.hello, {minHeight: myMinHeight}]}
                   multiline={true}
                   text = {this.props.text}
                   onScroll = {(event) => {
                       console.log(event.nativeEvent);
                   }}
                   onContentSizeChange= {(event) => {
                        this.setState({height: event.nativeEvent.contentSize.height});
                    }}
                   color = {'black'}
                   maxImagesWidth = {200} />
              }
            />
          </View>
        );
  }
}

var styles = StyleSheet.create({
    container: {
     flex: 1,
     paddingTop: 22
    },
    hello: {
    margin: 10,
    minHeight: 200,
  },
});

AppRegistry.registerComponent('SimpleTextInput', () => SimpleTextInput);
