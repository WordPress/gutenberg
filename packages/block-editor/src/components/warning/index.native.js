/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { normalizeIconObject } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function Warning( {
	title,
	message,
	icon,
	iconClass,
	preferredColorScheme,
	getStylesFromColorScheme,
	...viewProps
} ) {
	icon = icon && normalizeIconObject( icon );
	const internalIconClass = 'warning-icon' + '-' + preferredColorScheme;
	const titleStyle = getStylesFromColorScheme(
		styles.title,
		styles.titleDark
	);
	const messageStyle = getStylesFromColorScheme(
		styles.message,
		styles.messageDark
	);

	return (
		<View
			style={ getStylesFromColorScheme(
				styles.container,
				styles.containerDark
			) }
			{ ...viewProps }
		>
			{ icon && (
				<View style={ styles.icon }>
					<Icon
						className={ iconClass || internalIconClass }
						icon={ icon && icon.src ? icon.src : icon }
					/>
				</View>
			) }
			{ title && <Text style={ titleStyle }>{ title }</Text> }
			{ message && <Text style={ messageStyle }>{ message }</Text> }
		</View>
	);
}

export default withPreferredColorScheme( Warning );
