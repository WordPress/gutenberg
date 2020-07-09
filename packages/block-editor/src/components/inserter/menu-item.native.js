/**
 * External dependencies
 */
import { View, Text, TouchableHighlight } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
import { BottomSheet, Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;

function InserterMenuItem( { getStylesFromColorScheme, onSelect, item } ) {
	function calculateMinItemWidth( bottomSheetWidth ) {
		const { paddingLeft, paddingRight } = styles.columnPadding;
		return (
			( bottomSheetWidth - 2 * ( paddingLeft + paddingRight ) ) /
			MIN_COL_NUM
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

	const modalIconWrapperStyle = getStylesFromColorScheme(
		styles.modalIconWrapper,
		styles.modalIconWrapperDark
	);
	const modalIconStyle = getStylesFromColorScheme(
		styles.modalIcon,
		styles.modalIconDark
	);
	const modalItemLabelStyle = getStylesFromColorScheme(
		styles.modalItemLabel,
		styles.modalItemLabelDark
	);

	const columnProperties = calculateColumnsProperties();

	return (
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
						<Icon
							icon={ item.icon.src || item.icon }
							fill={ modalIconStyle.fill }
							size={ modalIconStyle.width }
						/>
					</View>
				</View>
				<Text style={ modalItemLabelStyle }>{ item.title }</Text>
			</View>
		</TouchableHighlight>
	);
}

export default withPreferredColorScheme( InserterMenuItem );
