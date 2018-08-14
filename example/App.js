import React, { Component } from 'react';
import {AppRegistry, StyleSheet, TextInput, FlatList, KeyboardAvoidingView, SafeAreaView, Platform} from 'react-native';
import {example_content} from './content';
import RCTAztecView from 'react-native-aztec'

const _minHeight = 100;

const sampleContent = example_content();

const elements = [
                {key: '1', text: sampleContent, height: _minHeight},
                {key: '2', text: sampleContent, height: _minHeight},
                {key: '3', text: sampleContent, height: _minHeight},
                {key: '4', text: sampleContent, height: _minHeight},
                {key: '5', text: sampleContent, height: _minHeight},
                {key: '6', text: sampleContent, height: _minHeight},
              ]   

export default class example extends React.Component {
    constructor(props) {
        super(props);
        this.renderItem = this.renderItem.bind(this)
        this.renderItemAsTextInput = this.renderItemAsTextInput.bind(this)
        this.state = {isShowingText: true, data: elements};                
    }
    
    renderItem( { item } ) {
      let myMinHeight = Math.max(_minHeight, item.height);
      const key = item.key;
      return (<RCTAztecView                
                style={[styles.aztec_editor, {minHeight: myMinHeight}]}
                text = { { text: item.text } } 
                placeholder = {'This is the placeholder text'}
                placeholderTextColor = {'lightgray'} // See http://facebook.github.io/react-native/docs/colors                
                onContentSizeChange= {(event) => {                    
                    let newHeight = event.nativeEvent.contentSize.height                    
                    const newElements = this.state.data.map( searchItem => {
                      if (searchItem.key == key) {
                        return {...searchItem, height: newHeight};
                      } else {
                        return searchItem;
                      }
                    })
                    this.setState( { data: newElements})                    
                }}
                onChange= {(event) => console.log(event.nativeEvent) }
                onEndEditing= {(event) => console.log(event.nativeEvent) }
                color = {'black'}
                maxImagesWidth = {200} 
              />
            )
    }

    renderItemAsTextInput( { item } ) {      
      return (<TextInput
                multiline = { true }
                value = { item.text }
              />
            )
    }

    render() { 
        const data = this.state.data;      
        const mainContent =  (          
            <KeyboardAvoidingView style={styles.container} behavior="padding">
              <FlatList                    
                    data={ data }
                    renderItem={ this.renderItem }
                  />
            </KeyboardAvoidingView>          
        );
        if (Platform.OS === "ios") {
          return (<SafeAreaView style={{flex:1}}>{mainContent}</SafeAreaView>)
        } else {
          return mainContent
        }
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
