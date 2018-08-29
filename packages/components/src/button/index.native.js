/**
 * External dependencies
 */
import { TouchableOpacity } from 'react-native';

export default function Button( props ) {
	const { children, onClick, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed } = props;
	return (
		<TouchableOpacity
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			onPress={ onClick }
			style={ { borderColor: ariaPressed ? 'black' : 'white', borderWidth: 1, borderRadius: 2 } }
		>
			{ children }
		</TouchableOpacity>
	);
}
