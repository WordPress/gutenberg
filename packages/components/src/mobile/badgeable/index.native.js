/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const Badge = ( { text } ) => (
	<View style={ styles.badge }>
		<Text style={ styles.badgeText }>{ text }</Text>
	</View>
);
const Badgeable = ( { text, children, show = true } ) => (
	<View>
		{ children }
		{ show && <Badge text={ text } /> }
	</View>
);

export default Badgeable;
