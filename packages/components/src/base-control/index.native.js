/**
 * External dependencies
 */
import { Text, View } from 'react-native';

export default function BaseControl( { id, label, help, className, children } ) {
	return (
		<View
			accessible={ true }
			accessibilityLabel={ label }
			style={ {fles: 1} }
		>
			{ label && <Text>{ label }</Text> }
			{ children }
			{ help && <Text>{ help }</Text> }
		</View>
	);
}