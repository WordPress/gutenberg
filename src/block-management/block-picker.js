/**
 * @format
 * @flow
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import React, { Component } from 'react';
import { FlatList, Text, TouchableHighlight, View } from 'react-native';
import Modal from 'react-native-modal';
import styles from './block-picker.scss';
import { name as unsupportedBlockName } from '../block-types/unsupported-block';
// Gutenberg imports
import { getBlockTypes } from '@wordpress/blocks';

type PropsType = {
	style?: StyleSheet,
	isReplacement: boolean,
	onValueSelected: ( itemValue: string ) => void,
	onDismiss: () => void,
};

export default class BlockPicker extends Component<PropsType> {
	availableBlockTypes = getBlockTypes().filter( ( { name } ) => name !== unsupportedBlockName );

	render() {
		const titleForAdd = __( 'ADD BLOCK' );
		return (
			<Modal
				transparent={ true }
				isVisible={ true }
				onSwipe={ this.props.onDismiss }
				onBackButtonPress={ this.props.onDismiss }
				swipeDirection="down"
				style={ [ styles.bottomModal, this.props.style ] }
				backdropColor={ 'lightgrey' }
				backdropOpacity={ 0.4 }
				onBackdropPress={ this.props.onDismiss }>
				<View style={ styles.modalContent }>
					<View style={ styles.shortLineStyle } />
					<View>
						<Text style={ styles.title }>
							{ titleForAdd }
						</Text>
					</View>
					<View style={ styles.lineStyle } />
					<FlatList
						keyboardShouldPersistTaps="always"
						numColumns={ 3 }
						data={ this.availableBlockTypes }
						keyExtractor={ ( item ) => item.name }
						renderItem={ ( { item } ) =>
							<TouchableHighlight
								style={ styles.touchableArea }
								underlayColor={ 'transparent' }
								activeOpacity={ .5 }
								onPress={ () => this.props.onValueSelected( item.name ) }>
								<View style={ styles.modalItem }>
									<View style={ styles.modalIcon }>
										{ item.icon.src }
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
