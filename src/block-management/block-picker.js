/**
 * @format
 * @flow
 */

/**
* External dependencies
*/
import React from 'react';
import { FlatList, Text, TouchableHighlight, View, Dimensions } from 'react-native';

/**
* WordPress dependencies
*/
import { SVG } from '@wordpress/components';
import { BottomSheet } from '@wordpress/editor';
import { Component } from '@wordpress/element';
import { getBlockTypes } from '@wordpress/blocks';

/**
* WordPress dependencies
*/
import styles from './block-picker.scss';
import { name as unsupportedBlockName } from '../block-types/unsupported-block';

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
			<BottomSheet
				isVisible={ true }
				onClose={ this.props.onDismiss }
				contentStyle={ styles.content }
				hideHeader
			>
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
			</BottomSheet>
		);
	}

	paddingBottom() {
		if ( this.props.safeAreaBottomInset > 0 ) {
			return this.props.safeAreaBottomInset - styles.modalItem.paddingBottom;
		}
		return styles.content.paddingBottom;
	}

	iconWithUpdatedFillColor( color: string, icon: SVG ) {
		return (
			<SVG viewBox={ icon.src.props.viewBox } xmlns={ icon.src.props.xmlns } style={ { fill: color } }>
				{ icon.src.props.children }
			</SVG>
		);
	}

	calculateNumberOfColumns() {
		const bottomSheetWidth = BottomSheet.getWidth();
		const { paddingLeft: itemPaddingLeft, paddingRight: itemPaddingRight } = styles.modalItem;
		const { paddingLeft: containerPaddingLeft, paddingRight: containerPaddingRight } = styles.content;
		const { width: itemWidth } = styles.modalIconWrapper;
		const itemTotalWidth = itemWidth + itemPaddingLeft + itemPaddingRight;
		const containerTotalWidth = bottomSheetWidth - ( containerPaddingLeft + containerPaddingRight );
		return Math.floor( containerTotalWidth / itemTotalWidth );
	}
}

BlockPicker.defaultProps = {
	safeAreaBottomInset: 0,
};
