/**
 * External dependencies
 */
import { View } from 'react-native';

export default ( props ) => (
	<View style={ { flexDirection: 'row' } }>
		{ props.children }
	</View>
);
