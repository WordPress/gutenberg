/**
 * External dependencies
 */
import {
	FlatList,
	View,
	TouchableHighlight,
	TouchableWithoutFeedback,
	Dimensions,
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

function InserterSearchResults( {
	items,
	onSelect,
	listProps,
	safeAreaBottomInset,
} ) {
	const [ numberOfColumns, setNumberOfColumns ] = useState( MIN_COL_NUM );
	const [ itemWidth, setItemWidth ] = useState();
	const [ maxWidth, setMaxWidth ] = useState();

	useEffect( () => {
		Dimensions.addEventListener( 'change', onLayout );
		return () => {
			Dimensions.removeEventListener( 'change', onLayout );
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
		const sumLeftRightPadding =
			styles.columnPadding.paddingLeft +
			styles.columnPadding.paddingRight;

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

	return (
		<TouchableHighlight accessible={ false }>
			<FlatList
				onLayout={ onLayout }
				key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
				keyboardShouldPersistTaps="always"
				numColumns={ numberOfColumns }
				data={ items }
				initialNumToRender={ 3 }
				ItemSeparatorComponent={ () => (
					<TouchableWithoutFeedback accessible={ false }>
						<View style={ styles.rowSeparator } />
					</TouchableWithoutFeedback>
				) }
				keyExtractor={ ( item ) => item.name }
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
				contentContainerStyle={ [
					...listProps.contentContainerStyle,
					{
						paddingBottom:
							safeAreaBottomInset || styles.list.paddingBottom,
					},
				] }
			/>
		</TouchableHighlight>
	);
}

export default InserterSearchResults;
