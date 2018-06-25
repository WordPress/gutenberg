import React, { Component } from 'react';
import {AppRegistry, StyleSheet, View, FlatList} from 'react-native';
import {example_content} from './content';
import RCTAztecView from 'react-native-aztec'

const _minHeight = 300;

export default class example extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isShowingText: true, height: _minHeight, text: example_content()};
        console.log("a ver que tiene" + JSON.stringify(this.state));
    }

    render() {
        let myMinHeight = Math.max(_minHeight, this.state.height);
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
                         style={[styles.aztec_editor, {minHeight: myMinHeight}]}
                         text = {this.state.text}
                         onContentSizeChange= {(event) => {
                              this.setState({height: event.nativeEvent.contentSize.height});
                          }}
                         onChange= {(event) => console.log(event.nativeEvent) }
                         onEndEditing= {(event) => console.log(event.nativeEvent) }
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
     flex: 1
    },
    aztec_editor: {
    minHeight: _minHeight,
    margin: 10,
  },
});

AppRegistry.registerComponent('example', () => example);
