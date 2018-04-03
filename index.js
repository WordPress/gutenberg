import React, { Component } from 'react';
import {AppRegistry, StyleSheet, View} from 'react-native';
import RCTAztecView from './AztecView';

class AztecTextInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isShowingText: true, height: 200};
  }

  render() {

 let myMinHeight = Math.max(200, this.state.height);
    return (
          <View style={styles.container}>
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

AppRegistry.registerComponent('RichTextInput', () => AztecTextInput);
