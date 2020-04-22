/**
 * External dependencies
 */
import {
	Dimensions,
	FlatList,
	Text,
	TouchableHighlight,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { BottomSheet, Icon } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;

function calculateMinItemWidth( bottomSheetWidth ) {
	const { paddingLeft, paddingRight } = styles.columnPadding;
	return (
		( bottomSheetWidth - 2 * ( paddingLeft + paddingRight ) ) / MIN_COL_NUM
	);
}

function calculateItemWidth() {
	const {
		paddingLeft: itemPaddingLeft,
		paddingRight: itemPaddingRight,
	} = styles.modalItem;
	const { width: itemWidth } = styles.modalIconWrapper;
	return itemWidth + itemPaddingLeft + itemPaddingRight;
}

function calculateColumnsProperties() {
	const bottomSheetWidth = BottomSheet.getWidth();
	const { paddingLeft, paddingRight } = styles.columnPadding;
	const itemTotalWidth = calculateItemWidth();
	const containerTotalWidth =
		bottomSheetWidth - ( paddingLeft + paddingRight );
	const numofColumns = Math.floor( containerTotalWidth / itemTotalWidth );

	if ( numofColumns < MIN_COL_NUM ) {
		return {
			numOfColumns: MIN_COL_NUM,
			itemWidth: calculateMinItemWidth( bottomSheetWidth ),
			maxWidth: containerTotalWidth / MIN_COL_NUM,
		};
	}
	return {
		numOfColumns: numofColumns,
		maxWidth: containerTotalWidth / numofColumns,
	};
}

const MenuBottomSheet = ( { isVisible, items, onClose, onSelect, title } ) => {
	const [ numberOfColumns, setNumberOfColumns ] = useState( MIN_COL_NUM );

	useEffect( () => {
		Dimensions.addEventListener( 'change', onLayout );

		return () => {
			Dimensions.removeEventListener( 'change', onLayout );
		};
	}, [] );

	const onLayout = () => {
		const columnProperties = calculateColumnsProperties();
		const numColumns = columnProperties.numOfColumns;

		setNumberOfColumns( numColumns );
	};

	const bottomPadding = styles.contentBottomPadding;
	const modalIconWrapperStyle = usePreferredColorSchemeStyle(
		styles.modalIconWrapper,
		styles.modalIconWrapperDark
	);
	const modalIconStyle = usePreferredColorSchemeStyle(
		styles.modalIcon,
		styles.modalIconDark
	);
	const modalItemLabelStyle = usePreferredColorSchemeStyle(
		styles.modalItemLabel,
		styles.modalItemLabelDark
	);
	const modalTitleStyle = usePreferredColorSchemeStyle(
		styles.modalTitle,
		styles.modalTitleDark
	);

	const columnProperties = calculateColumnsProperties();

	const headerComponent = () => {
		return title ? (
			<View>
				<Text style={ modalTitleStyle }>{ title }</Text>
			</View>
		) : null;
	};

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			contentStyle={ [ styles.content, bottomPadding ] }
			hideHeader
		>
			<TouchableHighlight accessible={ false }>
				<FlatList
					onLayout={ onLayout }
					scrollEnabled={ false }
					key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
					keyboardShouldPersistTaps="always"
					numColumns={ numberOfColumns }
					data={ items }
					ItemSeparatorComponent={ () => (
						<View style={ styles.rowSeparator } />
					) }
					ListHeaderComponent={ headerComponent }
					keyExtractor={ ( item ) => item.name }
					renderItem={ ( { item } ) => (
						<TouchableHighlight
							style={ styles.touchableArea }
							underlayColor="transparent"
							activeOpacity={ 0.5 }
							accessibilityLabel={ item.title }
							onPress={ () => onSelect( item ) }
						>
							<View
								style={ [
									styles.modalItem,
									{ width: columnProperties.maxWidth },
								] }
							>
								<View
									style={ [
										modalIconWrapperStyle,
										columnProperties.itemWidth && {
											width: columnProperties.itemWidth,
										},
									] }
								>
									<View style={ modalIconStyle }>
										{ item.icon.src ? (
											<Icon
												icon={ item.icon.src }
												fill={ modalIconStyle.fill }
												size={ modalIconStyle.width }
											/>
										) : (
											<Text
												style={ styles.modalIconText }
											>
												{ item.icon }
											</Text>
										) }
									</View>
								</View>
								<Text style={ modalItemLabelStyle }>
									{ item.title }
								</Text>
							</View>
						</TouchableHighlight>
					) }
				/>
			</TouchableHighlight>
		</BottomSheet>
	);
};

export default MenuBottomSheet;
