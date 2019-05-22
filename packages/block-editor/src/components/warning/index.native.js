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

function Warning( { title, icon, iconClass, ...viewProps } ) {
		icon = icon && normalizeIconObject( icon );
		return (
			<View
				style={ styles.container }
				{ ...viewProps }
			>
				{ icon && (
					<Icon className={ iconClass } icon={ icon && icon.src ? icon.src : icon } />
				)}
				<Text style={ styles.message }>{ title }</Text>
			</View>
		);
}

export default Warning;
