/**
 * @format
 * @flow
 */
import React, { Component } from 'react';
import { StyleSheet, FlatList, Text, TouchableHighlight, View } from 'react-native';
import Modal from 'react-native-modal';
// Gutenberg imports
import { getBlockTypes } from '@wordpress/blocks';

type PropsType = {
    visible: boolean,
    style?: StyleSheet,
	onValueSelected: ( itemValue: string, itemIndex: number ) => void,
	onDismiss: () => void,
};

type StateType = {
	selectedIndex: number,
};

const style = StyleSheet.create( {
	bottomModal: {
		justifyContent: "flex-end",
		margin: 0
	},

    modalContent: {
        backgroundColor: "white",
        padding: 22,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 4,
        borderColor: "rgba(0, 0, 0, 0.1)"
    },
} );

export default class BlockPicker extends Component<PropsType, StateType> {
	availableBlockTypes = getBlockTypes();

	constructor( props: PropsType ) {
		super( props );
		this.state = {
			selectedIndex: 0,
		};
	}

	render() {
		return (
			<Modal
                animationType="slide"
                transparent={ true }
                isVisible={ this.props.visible }
                onSwipe={ this.props.onDismiss.bind( this ) }
                swipeDirection="down"
                style={[style.bottomModal, this.props.style]}
                onBackdropPress={ this.props.onDismiss.bind( this ) }>
                <View style={style.modalContent}>
                    <FlatList
                        data={ this.availableBlockTypes }
                        keyExtractor={ ( item ) => item.name }
                        renderItem={({item}) =>
                            <TouchableHighlight onPress={ this.props.onValueSelected.bind( this, item.name, 1 ) }>
                                <View style={ { backgroundColor: 'white' } }>
                                    <Text>{item.name}</Text>
                                </View>
                            </TouchableHighlight>
                        }
                    />
                </View>
            </Modal>
        );
  }
} 
