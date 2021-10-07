/**
 * External dependencies
 */
import {
	View,
	TouchableHighlight,
	Text,
	ToastAndroid,
	Platform,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { sparkles } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';
// import { useSelect } from '@wordpress/data';
// import { store as editorStore } from '@wordpress/editor';

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
	const isClipboardBlock = item.id === 'clipboard';
	const blockTitle = isClipboardBlock ? __( 'Copied block' ) : item.title;
	const blockIsNew = item.isNew === true;
	const accessibilityLabelFormat = blockIsNew
		? // translators: Newly available block name. %s: The localized block name
		  __( '%s block, newly available' )
		: // translators: Block name. %s: The localized block name
		  __( '%s block' );
	const accessibilityLabel = sprintf( accessibilityLabelFormat, item.title );

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

	const isIOS = Platform.OS === 'ios';
	const shouldDisableTouch =
		item.isDisabled && ( isIOS || ! item.alreadyPresentInPost );

	// const { postType } = useSelect( ( select ) => ( {
	// 	postType: select( editorStore ).getEditedPostAttribute( 'type' ),
	// } ) );
	const postType = 'page';

	const onPress = useCallback( () => {
		if ( ! item.isDisabled ) {
			onSelect( item );
		} else if ( item.alreadyPresentInPost && ! isIOS ) {
			// Type of block doesn't support multiple instances. We only have a mechanism to
			// display it in Android

			const disabledMessage =
				postType === 'page'
					? // translators: %s: name of the block. e.g: "More"
					  __( 'You already have a %s block on this page.' )
					: // translators: %s: name of the block. e.g: "More"
					  __( 'You already have a %s block on this post.' );

			ToastAndroid.show(
				sprintf( disabledMessage, blockTitle ),
				ToastAndroid.SHORT
			);
		}
	}, [ item ] );

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
			disabled={ shouldDisableTouch }
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
