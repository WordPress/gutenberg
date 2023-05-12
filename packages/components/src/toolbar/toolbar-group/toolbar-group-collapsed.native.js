/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import DropdownMenu from '../../dropdown-menu/v1';
import styles from './style.scss';

function ToolbarGroupCollapsed( {
	controls = [],
	getStylesFromColorScheme,
	passedStyle,
	...props
} ) {
	return (
		<View
			style={ [
				getStylesFromColorScheme(
					styles.container,
					styles.containerDark
				),
				passedStyle,
			] }
		>
			<DropdownMenu controls={ controls } { ...props } />
		</View>
	);
}

export default withPreferredColorScheme( ToolbarGroupCollapsed );
