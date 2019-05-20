/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import React from 'react';
import { FlatList, Text, TouchableHighlight, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { SVG, Dashicon } from '@wordpress/components';
import { BottomSheet } from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { getBlockTypes, getUnregisteredTypeHandlerName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './block-picker.scss';

type PropsType = {
	style?: StyleSheet,
	isReplacement: boolean,
	onValueSelected: ( itemValue: string ) => void,
	onDismiss: () => void,
	addExtraBottomPadding: boolean,
};

export default class BlockPicker extends Component<PropsType> {
	availableBlockTypes = getBlockTypes().filter( ( { name } ) => name !== getUnregisteredTypeHandlerName() );

	render() {
		const numberOfColumns = this.calculateNumberOfColumns();
		const bottomPadding = this.props.addExtraBottomPadding && styles.contentBottomPadding;

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.props.onDismiss }
				contentStyle={ [ styles.content, bottomPadding ] }
				hideHeader
			>
				<FlatList
					scrollEnabled={ false }
					key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
					keyboardShouldPersistTaps="always"
					numColumns={ numberOfColumns }
					data={ this.availableBlockTypes }
					ItemSeparatorComponent={ () =>
						<View style={ styles.rowSeparator } />
					}
					keyExtractor={ ( item ) => item.name }
					renderItem={ ( { item } ) =>
						<TouchableHighlight
							style={ styles.touchableArea }
							underlayColor={ 'transparent' }
							activeOpacity={ .5 }
							accessibilityLabel={ item.title }
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

	iconWithUpdatedFillColor( color: string, icon: Object ) {
		if ( 'string' === typeof icon.src ) {
			return (
				<Dashicon icon={ icon.src } fill={ color } size={ styles.modalIcon.width } />
			);
		} else if ( icon.src && ( icon.src.type === 'svg' || icon.src.type === SVG ) ) {
			return (
				<SVG viewBox={ icon.src.props.viewBox } xmlns={ icon.src.props.xmlns } style={ { fill: color } }>
					{ icon.src.props.children }
				</SVG>
			);
		}
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
