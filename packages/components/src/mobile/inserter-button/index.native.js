/**
 * External dependencies
 */
import { View, TouchableHighlight, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { BlockIcon } from '@wordpress/block-editor';
import { SVG, Path } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class MenuItem extends Component {
	constructor() {
		super( ...arguments );

		this.onPress = this.onPress.bind( this );
	}

	onPress() {
		const { onSelect, item } = this.props;
		onSelect( item );
	}

	render() {
		const {
			getStylesFromColorScheme,
			item,
			itemWidth,
			maxWidth,
		} = this.props;

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

		const sparkles = (
			<SVG
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					d="M10 11c-1.588-.479-4-.91-4-.91s2-.241 4-.454c1.8-.191 3.365-.502 4-3.181C14.635 3.775 15 1 15 1s.365 2.775 1 5.455c.635 2.679 2 2.969 4 3.181 2 .213 4 .455 4 .455s-2.412.43-4 .909c-1.588.479-3 1-4 4.546-.746 2.643-.893 4.948-1 5.454-.107-.506-.167-2.5-1-5.454C13 12 11.588 11.479 10 11zM7.333 3.5C6.803 3.333 6 3.182 6 3.182s.667-.085 1.333-.16c.6-.066 1.122-.175 1.334-1.113C8.878.971 9 0 9 0s.122.971.333 1.91c.212.937.667 1.038 1.334 1.113.666.074 1.333.159 1.333.159s-.804.15-1.333.318c-.53.167-1 .35-1.334 1.59C9.085 6.017 9.036 6.824 9 7c-.036-.177-.056-.875-.333-1.91-.334-1.24-.804-1.423-1.334-1.59zM2.444 18C1.474 17.713 0 17.454 0 17.454s1.222-.145 2.444-.272c1.1-.115 2.057-.302 2.445-1.91C5.277 13.666 5.5 12 5.5 12s.223 1.665.611 3.273c.388 1.607 1.222 1.781 2.445 1.909 1.222.127 2.444.273 2.444.273s-1.474.258-2.444.545c-.971.287-1.834.6-2.445 2.727-.456 1.586-.546 2.97-.611 3.273-.065-.304-.102-1.5-.611-3.273C4.278 18.6 3.415 18.287 2.444 18z"
					fill="#F0C930"
				/>
			</SVG>
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
					</View>
					<Text numberOfLines={ 3 } style={ modalItemLabelStyle }>
						{ blockTitle }
					</Text>
				</View>
			</TouchableHighlight>
		);
	}
}

const InserterButton = withPreferredColorScheme( MenuItem );

InserterButton.Styles = {
	modalItem: styles.modalItem,
	modalIconWrapper: styles.modalIconWrapper,
};

export default InserterButton;
