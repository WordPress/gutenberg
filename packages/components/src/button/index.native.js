/**
 * External dependencies
 */
import { TouchableOpacity } from 'react-native';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export function Button( props ) {
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

export default forwardRef( Button );
