/**
 * External dependencies
 */
import { View } from 'react-native';

export default ( props ) => (
	<View		
		style={ props.className }
	>
		{ props.children }
	</View>
);
