/**
 * External dependencies
 */
import { Text, View } from 'react-native';

export default function BaseControl( { label, help, children } ) {
	return (
		<View accessible accessibilityLabel={ label }>
			{ label && <Text>{ label }</Text> }
			{ children }
			{ help && <Text>{ help }</Text> }
		</View>
	);
}
