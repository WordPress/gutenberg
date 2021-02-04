/**
 * External dependencies
 */
import { View } from 'react-native';

function Disabled( { children } ) {
	return <View pointerEvents="none">{ children }</View>;
}

export default Disabled;
