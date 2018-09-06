import React, { Component } from 'react';
import {StyleSheet, Button, View} from 'react-native';
import AztecView from 'react-native-aztec'

const _minHeight = 100;

export default class Editor extends Component {
    constructor(props) {
        super(props);
        this.onFormatPress = this.onFormatPress.bind(this) 
        this.onActiveFormatsChange = this.onActiveFormatsChange.bind(this)
        this.isFormatActive = this.isFormatActive.bind(this)
        this.state = { activeFormats: [] };       
    }
    
    onFormatPress( format ) {
      const { _aztec } = this.refs;
      _aztec.applyFormat(format);
    }

    onActiveFormatsChange( formats ) {      
      this.setState({activeFormats: formats });
    }

    isFormatActive( format ) {
      const { activeFormats } = this.state;
      console.log(activeFormats);
      return activeFormats.indexOf(format) != -1;
    }
    
    render() {
      const { item, onContentSizeChange } = this.props;
      let myMinHeight = Math.max(_minHeight, item.height);      
      return (
              <View>
              <View style={{flex: 1, flexDirection: 'row'}}>
                <Button title="Bold" color={ this.isFormatActive("bold") ? 'black' : 'gray' } onPress={ () => { this.onFormatPress("bold") } }/>
                <Button title="Italic" color={ this.isFormatActive("italic") ? 'black' : 'gray' } onPress={ () => { this.onFormatPress("italic") } }/>
                <Button title="Strikethrough" color={ this.isFormatActive("strikethrough") ? 'black' : 'gray' } onPress={ () => { this.onFormatPress("strikethrough") } }/>
              </View>
              <AztecView
                ref="_aztec"
                style={[styles.aztec_editor, {minHeight: myMinHeight}]}
                text = { { text: item.text } } 
                placeholder = {'This is the placeholder text'}
                placeholderTextColor = {'lightgray'} // See http://facebook.github.io/react-native/docs/colors                
                onContentSizeChange= { onContentSizeChange }
                onChange= {(event) => console.log(event.nativeEvent) }
                onEnter= {(event) => console.log("asta") }
                onEndEditing= {(event) => console.log(event.nativeEvent) }
                onActiveFormatsChange = { this.onActiveFormatsChange }
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
