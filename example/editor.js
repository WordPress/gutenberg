import React, { Component } from 'react';
import {StyleSheet, Button, View} from 'react-native';
import RCTAztecView from 'react-native-aztec'

const _minHeight = 100;

export default class Editor extends Component {
    constructor(props) {
        super(props);
        this.formatPressed = this.formatPressed.bind(this)        
    }
    
    formatPressed( format ) {
      const { _aztec } = this.refs;
      _aztec.applyFormat(format)
    }
    
    render() {
      const { item, onContentSizeChange } = this.props;
      let myMinHeight = Math.max(_minHeight, item.height);      
      return (
              <View>
              <View style={{flex: 1, flexDirection: 'row'}}>
                <Button title="Bold" onPress={ () => { this.formatPressed("bold") } }/>
                <Button title="Italic" onPress={ () => { this.formatPressed("italic") } }/>
                <Button title="Strikethrough" onPress={ () => { this.formatPressed("strikethrough") } }/>
              </View>
              <RCTAztecView
                ref="_aztec"
                style={[styles.aztec_editor, {minHeight: myMinHeight}]}
                text = { { text: item.text } } 
                placeholder = {'This is the placeholder text'}
                placeholderTextColor = {'lightgray'} // See http://facebook.github.io/react-native/docs/colors                
                onContentSizeChange= { onContentSizeChange }
                onChange= {(event) => console.log(event.nativeEvent) }
                onEndEditing= {(event) => console.log(event.nativeEvent) }
                color = {'black'}
                maxImagesWidth = {200} 
              />
              </View>
            )
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
