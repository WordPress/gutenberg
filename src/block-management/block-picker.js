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
	onValueSelected: ( itemValue: string, itemIndex: number ) => void,
	onDismiss: () => void,
};

type StateType = {
	selectedIndex: number,
};

const style = StyleSheet.create( {
	bottomModal: {
		justifyContent: 'flex-end',
		backgroundColor: 'white',
		padding: 22,
		alignItems: 'center',
		borderRadius: 4,
		borderColor: 'rgba(0, 0, 0, 0.1)',
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
                transparent={false}
                isVisible={ this.props.visible }
                onSwipe={ this.props.onDismiss.bind( this ) }
                swipeDirection="down"
                style={style.bottomModal}>
                <View style={{marginTop: 22}}>
                    <FlatList
                        data={ this.availableBlockTypes }
                        keyExtractor={ ( item ) => item.name }
                        renderItem={({item}) =>
                            <TouchableHighlight onPress={ this.props.onValueSelected.bind( this, item.name, 1 ) }>
                                <View style={{backgroundColor: 'white'}}>
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
