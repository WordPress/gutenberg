/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const Badge = ( { label } ) => {
	return (
		<View style={ styles.badgeContainer }>
			<Text style={ styles.badge }>{ label }</Text>
		</View>
	);
};

export default withPreferredColorScheme( Badge );
