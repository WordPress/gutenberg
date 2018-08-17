/**
 * External dependencies
 */
import { TouchableOpacity } from 'react-native';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export function Button( props ) {
	const { onClick } = props;
	const ariaLabel = props[ 'aria-label' ];
	return (
		<TouchableOpacity
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			onPress={ onClick }
		>
			{ props.children }
		</TouchableOpacity>
	);
}

export default forwardRef( Button );
