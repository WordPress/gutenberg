/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View } from 'react-native';

function Disabled( { children, isDisabled, onPressDisabled } ) {
	const touchableEnabled = isDisabled && onPressDisabled;
	return (
		<TouchableWithoutFeedback
			disabled={ ! touchableEnabled }
			onPress={ onPressDisabled }
		>
			<View pointerEvents={ isDisabled ? 'box-only' : 'auto' }>
				{ children }
			</View>
		</TouchableWithoutFeedback>
	);
}

export default Disabled;
