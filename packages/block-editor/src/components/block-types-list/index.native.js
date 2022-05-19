/**
 * External dependencies
 */
import {
	Dimensions,
	FlatList,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { BottomSheet, InserterButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;

export default function BlockTypesList( {
	name,
	items,
	onSelect,
	listProps,
	initialNumToRender = 3,
} ) {
	const [ numberOfColumns, setNumberOfColumns ] = useState( MIN_COL_NUM );
	const [ itemWidth, setItemWidth ] = useState();
	const [ maxWidth, setMaxWidth ] = useState();

	useEffect( () => {
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onLayout
		);
		onLayout();
		return () => {
			dimensionsChangeSubscription.remove();
		};
	}, [] );

	function calculateItemWidth() {
		const {
			paddingLeft: itemPaddingLeft,
			paddingRight: itemPaddingRight,
		} = InserterButton.Styles.modalItem;
		const { width } = InserterButton.Styles.modalIconWrapper;
		return width + itemPaddingLeft + itemPaddingRight;
	}

	function onLayout() {
		const columnStyle = styles[ 'block-types-list__column' ];
		const sumLeftRightPadding =
			columnStyle.paddingLeft + columnStyle.paddingRight;

		const bottomSheetWidth = BottomSheet.getWidth();
		const containerTotalWidth = bottomSheetWidth - sumLeftRightPadding;
		const itemTotalWidth = calculateItemWidth();

		const columnsFitToWidth = Math.floor(
			containerTotalWidth / itemTotalWidth
		);

		const numColumns = Math.max( MIN_COL_NUM, columnsFitToWidth );

		setNumberOfColumns( numColumns );
		setMaxWidth( containerTotalWidth / numColumns );

		if ( columnsFitToWidth < MIN_COL_NUM ) {
			const updatedItemWidth =
				( bottomSheetWidth - 2 * sumLeftRightPadding ) / MIN_COL_NUM;
			setItemWidth( updatedItemWidth );
		}
	}

	const contentContainerStyle = StyleSheet.flatten(
		listProps.contentContainerStyle
	);

	return (
		<FlatList
			onLayout={ onLayout }
			key={ `InserterUI-${ name }-${ numberOfColumns }` } // Re-render when numberOfColumns changes.
			testID={ `InserterUI-${ name }` }
			keyboardShouldPersistTaps="always"
			numColumns={ numberOfColumns }
			data={ items }
			initialNumToRender={ initialNumToRender }
			ItemSeparatorComponent={ () => (
				<TouchableWithoutFeedback accessible={ false }>
					<View
						style={ styles[ 'block-types-list__row-separator' ] }
					/>
				</TouchableWithoutFeedback>
			) }
			keyExtractor={ ( item ) => item.id }
			renderItem={ ( { item } ) => (
				<InserterButton
					{ ...{
						item,
						itemWidth,
						maxWidth,
						onSelect,
					} }
				/>
			) }
			{ ...listProps }
			contentContainerStyle={ {
				...contentContainerStyle,
				paddingBottom: Math.max(
					listProps.safeAreaBottomInset,
					contentContainerStyle.paddingBottom
				),
			} }
		/>
	);
}
