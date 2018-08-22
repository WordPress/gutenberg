/**
 * @format
 * @flow
 */
import React, { Component } from 'react';
import { FlatList, Text, TouchableHighlight, View } from 'react-native';
import Modal from 'react-native-modal';
import styles from './block-picker.scss';
// Gutenberg imports
import { getBlockTypes } from '@wordpress/blocks';

type PropsType = {
	visible: boolean,
	style?: StyleSheet,
	onValueSelected: ( itemValue: string, itemIndex: number ) => void,
	onDismiss: () => void,
};

// TODO: not used for now - will hold currently selected Block Type, probably makes sense for the inspector
type StateType = {
	selectedIndex: number,
};

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
				style={ [ styles.bottomModal, this.props.style ] }
				backdropColor={ 'grey' }
				onBackdropPress={ this.props.onDismiss.bind( this ) }>
				<View style={ styles.modalContent }>
					<View>
						<Text style={ styles.title }>ADD BLOCK</Text>
					</View>
					<View style={ styles.lineStyle } />
					<FlatList
						numColumns={ 3 }
						data={ this.availableBlockTypes }
						keyExtractor={ ( item ) => item.name }
						renderItem={ ( { item } ) =>
							<TouchableHighlight 
								style= { styles.touchableArea }
								underlayColor= { 'transparent' }
								activeOpacity= { .5 }
								onPress={ this.props.onValueSelected.bind( this, item.name ) }>
								<View style={ styles.modalItem }>
									<View style={ styles.modalIcon }>
										{ /* TODO: ICON IMAGE GOES HERE */ }
									</View>
									<Text style={ styles.modalItemLabel }>{ item.title }</Text>
								</View>
							</TouchableHighlight>
						}
					/>
				</View>
			</Modal>
		);
	}
}
