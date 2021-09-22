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
import { sparkles } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function MenuItem( {
	getStylesFromColorScheme,
	item,
	itemWidth,
	maxWidth,
	onSelect,
} ) {
	const onPress = useCallback( () => {
		if ( ! item.isDisabled ) {
			onSelect( item );
		}
	}, [ item ] );

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
	const blockTitle = isClipboardBlock ? __( 'Copied block' ) : item.title;
	const blockIsNew = item.isNew === true;
	const accessibilityLabelFormat = blockIsNew
		? // translators: Newly available block name. %s: The localized block name
		  __( '%s block, newly available' )
		: // translators: Block name. %s: The localized block name
		  __( '%s block' );
	const accessibilityLabel = sprintf( accessibilityLabelFormat, item.title );

<<<<<<< HEAD
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
			: // translators: Block name. %s: The localized block name
			  __( '%s block' );
		const accessibilityLabel = sprintf(
			accessibilityLabelFormat,
			item.title
		);

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
				onPress={ this.onPress }
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
							<Icon
								icon={ sparkles }
								style={ styles.newIndicator }
							/>
						) }
						<View style={ modalIconStyle }>
							<BlockIcon
								icon={ item.icon }
								size={ modalIconStyle.width }
							/>
						</View>
=======
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
						<Icon
							icon={ item.icon.src || item.icon }
							fill={ modalIconStyle.fill }
							size={ modalIconStyle.width }
						/>
>>>>>>> d157d905f6 (Migrate InserterButton to a functional component)
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
