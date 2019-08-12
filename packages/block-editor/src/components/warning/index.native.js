/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { normalizeIconObject } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function Warning( { title, message, icon, iconClass, ...viewProps } ) {
	icon = icon && normalizeIconObject( icon );
	return (
		<View
			style={ styles.container }
			{ ...viewProps }
		>
			{ icon && (
				<View style={ styles.icon }>
					<Icon
						className={ iconClass || 'warning-icon' }
						icon={ icon && icon.src ? icon.src : icon }
					/>
				</View>
			) }
			{ title && (
				<Text style={ styles.title }>{ title }</Text>
			) }
			{ message && (
				<Text style={ styles.message }>{ message }</Text>
			) }
		</View>
	);
}

export default Warning;
