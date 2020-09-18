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
			<View style={ [ styles.modalItem, { width: maxWidth } ] }>
				<View
					style={ [
						modalIconWrapperStyle,
						itemWidth && {
							width: itemWidth,
						},
						isClipboardBlock && clipboardBlockStyles,
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
				<Text style={ modalItemLabelStyle }>
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
	} = styles.modalItem;
	const { width: itemWidth } = styles.modalIconWrapper;
	return itemWidth + itemPaddingLeft + itemPaddingRight;
}

const ThemedInserterListItem = withPreferredColorScheme( InserterListItem );

ThemedInserterListItem.getWidth = getWidth;

export default ThemedInserterListItem;
