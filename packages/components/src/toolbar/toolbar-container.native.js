/**
 * External dependencies
 */
import { View } from 'react-native';

export default ( props ) => (
	<View style={ { flex: 1, flexDirection: 'row' } }>
		{ props.children }
	</View>
);
