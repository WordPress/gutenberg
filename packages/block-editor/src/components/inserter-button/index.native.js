/**
 * External dependencies
 */
import { View, TouchableHighlight, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BlockIcon } from '../block-icon';
import styles from './style.scss';
import sparkles from './sparkles';

function MenuItem( {
	getStylesFromColorScheme,
	item,
	itemWidth,
	maxWidth,
	onSelect,
} ) {
	const onPress = useCallback( () => {
		onSelect( item );
	}, [ onSelect, item ] );

	const modalIconWrapperStyle = getStylesFromColorScheme(
		styles.modalIconWrapper,
		styles.modalIconWrapperDark
	);
	const modalIconStyle = styles.modalIcon;
	const modalItemLabelStyle = getStylesFromColorScheme(
		styles.modalItemLabel,
		styles.modalItemLabelDark
	);

	const clipboardBlockStyles = getStylesFromColorScheme(
		styles.clipboardBlock,
		styles.clipboardBlockDark
	);

	const isClipboardBlock = item.id === 'clipboard';
	const blockTitle = isClipboardBlock ? __( 'Copied block' ) : item.title;
	const blockIsNew = item.isNew === true;
	const accessibilityLabelFormat = blockIsNew
		? // translators: Newly available block name. %s: The localized block name
		  __( '%s block, newly available' )
		: // translators: %s: Block name e.g. "Image block"
		  __( '%s block' );
	const accessibilityLabel = sprintf( accessibilityLabelFormat, item.title );

	return (
		<TouchableHighlight
			style={ [
				styles.touchableArea,
				item.isDisabled ? styles.disabled : null,
			] }
			underlayColor="transparent"
			activeOpacity={ 0.5 }
			accessibilityRole="button"
			accessibilityLabel={ accessibilityLabel }
			onPress={ onPress }
			disabled={ item.isDisabled }
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
					{ blockIsNew && (
						<Icon icon={ sparkles } style={ styles.newIndicator } />
					) }
					<View style={ modalIconStyle }>
						<BlockIcon
							icon={ item.icon }
							size={ modalIconStyle.width }
						/>
					</View>
				</View>
				<Text numberOfLines={ 3 } style={ modalItemLabelStyle }>
					{ blockTitle }
				</Text>
			</View>
		</TouchableHighlight>
	);
}

const InserterButton = withPreferredColorScheme( MenuItem );

InserterButton.Styles = {
	modalItem: styles.modalItem,
	modalIconWrapper: styles.modalIconWrapper,
};

export default InserterButton;
