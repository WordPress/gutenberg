/**
 * External dependencies
 */
import { get } from 'lodash';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';

export default function BlockIcon( { icon, showColors = false } ) {
	if ( get( icon, [ 'src' ] ) === 'block-default' ) {
		icon = {
			src: blockDefault,
		};
	}

	const renderedIcon = <Icon icon={ icon && icon.src ? icon.src : icon } />;
	const style = showColors
		? {
				backgroundColor: icon && icon.background,
				color: icon && icon.foreground,
		  }
		: {};

	return <View style={ style }>{ renderedIcon }</View>;
}
