/**
 * External dependencies
 */
import { View } from 'react-native';

const ToolbarContainer = ( props ) => (
	<View style={ { flexDirection: 'row', borderRightWidth:1, borderRightColor: '#a8bece', paddingLeft: 5, paddingRight: 5} }>
		{ props.children }
	</View>
);

export default ToolbarContainer;