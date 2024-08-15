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
	actions,
	title,
	message,
	icon,
	iconClass,
	preferredColorScheme,
	getStylesFromColorScheme,
	containerStyle: extraContainerStyle,
	titleStyle: extraTitleStyle,
	messageStyle: extraMessageStyle,
	...viewProps
} ) {
	icon = icon && normalizeIconObject( icon );
	const internalIconClass = 'warning-icon' + '-' + preferredColorScheme;

	const containerStyle = [
		getStylesFromColorScheme( styles.container, styles.containerDark ),
		extraContainerStyle,
	];
	const titleStyle = [
		getStylesFromColorScheme( styles.title, styles.titleDark ),
		extraTitleStyle,
	];
	const messageStyle = [
		getStylesFromColorScheme( styles.message, styles.messageDark ),
		extraMessageStyle,
	];

	return (
		<View style={ containerStyle } { ...viewProps }>
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
			{ actions }
		</View>
	);
}

export default withPreferredColorScheme( Warning );
