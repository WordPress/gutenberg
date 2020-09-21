/**
 * External dependencies
 */
import { View, TouchableHighlight, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function InserterListItem( {
	getStylesFromColorScheme,
	item,
	itemWidth,
	maxWidth,
	onSelect,
} ) {
	const onPress = () => {
		onSelect( item );
	};

	const iconWrapperStyle = getStylesFromColorScheme(
		styles.iconWrapper,
		styles.iconWrapperDark
	);
	const iconStyle = getStylesFromColorScheme( styles.icon, styles.iconDark );
	const itemLabelStyle = getStylesFromColorScheme(
		styles.itemLabel,
		styles.itemLabelDark
	);

	const clipboardBlockStyles = getStylesFromColorScheme(
		styles.clipboardBlock,
		styles.clipboardBlockDark
	);

	const isClipboardBlock = item.id === 'clipboard';

	return (
		<TouchableHighlight
			style={ styles.touchableArea }
			underlayColor="transparent"
			activeOpacity={ 0.5 }
			accessibilityLabel={ item.title }
			onPress={ onPress }
		>
			<View style={ [ styles.item, { width: maxWidth } ] }>
				<View
					style={ [
						iconWrapperStyle,
						itemWidth && {
							width: itemWidth,
						},
						isClipboardBlock && clipboardBlockStyles,
					] }
				>
					<View style={ iconStyle }>
						<Icon
							icon={ item.icon.src || item.icon }
							fill={ iconStyle.fill }
							size={ iconStyle.width }
						/>
					</View>
				</View>
				<Text style={ itemLabelStyle }>
					{ isClipboardBlock ? __( 'Copied block' ) : item.title }
				</Text>
			</View>
		</TouchableHighlight>
	);
}

function getWidth() {
	const {
		paddingLeft: itemPaddingLeft,
		paddingRight: itemPaddingRight,
	} = styles.item;
	const { width: itemWidth } = styles.iconWrapper;
	return itemWidth + itemPaddingLeft + itemPaddingRight;
}

const ThemedInserterListItem = withPreferredColorScheme( InserterListItem );

ThemedInserterListItem.getWidth = getWidth;

export default ThemedInserterListItem;
