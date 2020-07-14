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
import { __ } from '@wordpress/i18n';

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
				onPress={ this.onPress }
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
								icon={ item.icon.src }
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
}

export default withPreferredColorScheme( MenuItem );
