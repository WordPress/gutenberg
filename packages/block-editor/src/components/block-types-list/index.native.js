/**
 * External dependencies
 */
import {
	Dimensions,
	FlatList,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
	useWindowDimensions,
} from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { BottomSheet, InserterButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;

function SeparatorComponent() {
	return (
		<TouchableWithoutFeedback accessible={ false }>
			<View style={ styles[ 'block-types-list__row-separator' ] } />
		</TouchableWithoutFeedback>
	);
}

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
	const { height, width } = useWindowDimensions();

	// useEffect( () => {
	// 	Dimensions.addEventListener( 'change', onLayout );
	// 	onLayout();
	// 	return () => {
	// 		Dimensions.removeEventListener( 'change', onLayout );
	// 	};
	// }, [] );

	function calculateItemWidth() {
		const {
			paddingLeft: itemPaddingLeft,
			paddingRight: itemPaddingRight,
		} = InserterButton.Styles.modalItem;
		const {
			width: inserterButtonWidth,
		} = InserterButton.Styles.modalIconWrapper;
		return inserterButtonWidth + itemPaddingLeft + itemPaddingRight;
	}

	useEffect( () => {
		onLayout();
	}, [ width ] );

	const onLayout = useCallback( () => {
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
	}, [ width ] );

	const contentContainerStyle = StyleSheet.flatten(
		listProps.contentContainerStyle
	);

	const ItemComponent = useCallback(
		( { item } ) => (
			<InserterButton
				{ ...{
					item,
					itemWidth,
					maxWidth,
					onSelect,
				} }
			/>
		),
		[]
	);

	const KeyExtractor = useCallback( ( item ) => `${ item.id }`, [] );

	const containerStyle = {
		flexGrow: 1,
		...contentContainerStyle,
		paddingBottom: Math.max(
			listProps.safeAreaBottomInset,
			contentContainerStyle.paddingBottom
		),
	};

	return (
		<BottomSheetFlatList
			key={ `InserterUI-${ name }-${ numberOfColumns }` } //re-render when numberOfColumns changes
			testID={ `InserterUI-${ name }` }
			keyboardShouldPersistTaps="always"
			numColumns={ numberOfColumns }
			data={ items }
			initialNumToRender={ initialNumToRender }
			ItemSeparatorComponent={ SeparatorComponent }
			keyExtractor={ KeyExtractor }
			renderItem={ ItemComponent }
			{ ...listProps }
			style={ { maxHeight: 400 } }
			contentContainerStyle={ containerStyle }
		/>
	);
}
