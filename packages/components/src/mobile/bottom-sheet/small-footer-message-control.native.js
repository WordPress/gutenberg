/**
 * External dependencies
 */
import { Text } from 'react-native';
/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './styles.scss';

function SmallFooterMessageControl( { value } ) {
	return <Text style={ styles.smallFooterMessageControl }>{ value }</Text>;
}

export default withPreferredColorScheme( SmallFooterMessageControl );
