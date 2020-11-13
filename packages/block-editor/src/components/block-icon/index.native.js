/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export function BlockIcon( {
	icon,
	showColors = false,
	getStylesFromColorScheme,
} ) {
	if ( icon?.src === 'block-default' ) {
		icon = {
			src: blockDefault,
		};
	}

	const renderedIcon = (
		<Icon
			icon={ icon && icon.src ? icon.src : icon }
			{ ...getStylesFromColorScheme(
				styles.iconPlaceholder,
				styles.iconPlaceholderDark
			) }
		/>
	);
	const style = showColors
		? {
				backgroundColor: icon && icon.background,
				color: icon && icon.foreground,
		  }
		: {};

	return <View style={ style }>{ renderedIcon }</View>;
}

export default withPreferredColorScheme( BlockIcon );
