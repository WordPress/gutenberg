/**
 * @format
 * @flow
 */
import React, {Component} from 'react';
import {StyleSheet, Text, TouchableHighlight, View} from 'react-native';
import Modal from 'react-native-modal';

type PropsType =  {
	uid: string,
	onValueSelected: ( itemValue: string, itemIndex: number ) => void,
	onDismiss: () => void,
};

type StateType = {
	selectedIndex: number,
};

const style = StyleSheet.create({
    bottomModal: {
        justifyContent: "flex-end",
        margin: 0
      },
  });

 export default class BlockPicker extends Component<PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );
		this.state = {
            selectedIndex: 0,
            //modalVisible: false,
			//focused: false,
		};
	}
    
    // setModalVisible(visible) {
    //     this.setState({modalVisible: visible});
    // }

   render() {
    return (
        <Modal
          animationType="slide"
          transparent={false}
          isVisible={ this.props.visible }
        //   onSwipe={() => this.setState({ modalVisible: null })}
          onSwipe={ this.props.onDismiss.bind( this ) }
          swipeDirection="down"
          style={style.bottomModal}>
          <View style={{marginTop: 22}}>
            <View>
              <Text>Hello World!</Text>
               <TouchableHighlight
				onPress={ this.props.onValueSelected.bind( this, 'core/paragraph', 1 ) }
                // onPress={() => {
                //   this.setModalVisible(!this.state.modalVisible);
                // }}
                >
                <Text>Hide Modal</Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>
    );
  }
} 
