/**
 * External dependencies
 */
import { View } from 'react-native';

const ToolbarContainer = ( props ) => (
	<View
		style={ { flex: 1 } }
	>
		{ props.children }
	</View>
);
export default ToolbarContainer;
