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
import { BottomSheet, Icon } from '@wordpress/components';
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
										<Icon icon={ item.icon.src } fill={ styles.modalIcon.fill } size={ styles.modalIcon.width } />
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
