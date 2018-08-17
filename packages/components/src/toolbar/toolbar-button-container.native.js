/**
 * External dependencies
 */
import { View } from 'react-native';

export default ( props ) => (
	<View
		key={ props.keyProp }
		style={ props.className }
	>
		{ props.children }
	</View>
);
