/**
 * External dependencies
 */
import { TouchableOpacity } from 'react-native';

export default function Button( props ) {
	const { children, onClick, 'aria-label': ariaLabel } = props;	
	return (
		<TouchableOpacity
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			onPress={ onClick }
		>
			{ children }
		</TouchableOpacity>
	);
}
