import React, { Component } from 'react';
import {AppRegistry, StyleSheet, View, FlatList} from 'react-native';
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
                         text = {this.props.text}
                         onContentSizeChange= {(event) => {
                         console.log(event.nativeEvent);
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
    minHeight: 400,
  },
});

AppRegistry.registerComponent('RichTextInput', () => AztecTextInput);
