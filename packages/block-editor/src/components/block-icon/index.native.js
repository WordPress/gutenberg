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
	fill: fillColor,
	size,
	showColors = false,
	getStylesFromColorScheme,
} ) {
	if ( icon?.src === 'block-default' ) {
		icon = {
			src: blockDefault,
		};
	}

	const fill = fillColor || ( showColors && icon?.foreground );

	const renderedIcon = (
		<Icon
			icon={ icon && icon.src ? icon.src : icon }
			{ ...( fill && { fill } ) }
			{ ...( size && { size } ) }
			{ ...( ! fill &&
				getStylesFromColorScheme(
					styles.iconPlaceholder,
					styles.iconPlaceholderDark
				) ) }
		/>
	);
	const style = showColors
		? {
				backgroundColor: icon && icon.background,
		  }
		: {};

	return <View style={ style }>{ renderedIcon }</View>;
}

export default withPreferredColorScheme( BlockIcon );
