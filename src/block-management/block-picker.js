/**
 * @format
 * @flow
 */

/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/components';

import React from 'react';
import { Component } from '@wordpress/element';
import { FlatList, Text, TouchableHighlight, View, Dimensions } from 'react-native';
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
	safeAreaBottomInset: number,
};

export default class BlockPicker extends Component<PropsType> {
	availableBlockTypes = getBlockTypes().filter( ( { name } ) => name !== unsupportedBlockName );

	render() {
		const numberOfColumns = this.calculateNumberOfColumns();
		const paddingBottom = this.paddingBottom();

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
				<View style={ [ styles.modalContent, { paddingBottom } ] }>
					<View style={ styles.shortLineStyle } />
					<FlatList
						scrollEnabled={ false }
						key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
						keyboardShouldPersistTaps="always"
						numColumns={ numberOfColumns }
						data={ this.availableBlockTypes }
						keyExtractor={ ( item ) => item.name }
						renderItem={ ( { item } ) =>
							<TouchableHighlight
								style={ styles.touchableArea }
								underlayColor={ 'transparent' }
								activeOpacity={ .5 }
								onPress={ () => this.props.onValueSelected( item.name ) }>
								<View style={ styles.modalItem }>
									<View style={ styles.modalIconWrapper }>
										<View style={ styles.modalIcon }>
											{ this.iconWithUpdatedFillColor( styles.modalIcon.fill, item.icon ) }
										</View>
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

	paddingBottom() {
		if ( this.props.safeAreaBottomInset > 0 ) {
			return this.props.safeAreaBottomInset - styles.modalItem.paddingBottom;
		}
		return styles.modalContent.paddingBottom;
	}

	iconWithUpdatedFillColor( color: string, icon: SVG ) {
		return (
			<SVG viewBox={ icon.src.props.viewBox } xmlns={ icon.src.props.xmlns } style={ { fill: color } }>
				{ icon.src.props.children }
			</SVG>
		);
	}

	calculateNumberOfColumns() {
		const { width: windowWidth } = Dimensions.get( 'window' );
		const { paddingLeft: itemPaddingLeft, paddingRight: itemPaddingRight } = styles.modalItem;
		const { paddingLeft: containerPaddingLeft, paddingRight: containerPaddingRight } = styles.modalContent;
		const { width: itemWidth } = styles.modalIconWrapper;
		const itemTotalWidth = itemWidth + itemPaddingLeft + itemPaddingRight;
		const containerTotalWidth = windowWidth - ( containerPaddingLeft + containerPaddingRight );
		return Math.floor( containerTotalWidth / itemTotalWidth );
	}
}

BlockPicker.defaultProps = {
	safeAreaBottomInset: 0,
};
