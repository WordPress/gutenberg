/**
 * External dependencies
 */
import { Image as RNImage } from 'react-native';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export function Image( { src, alt, ...additionalProps }, ref ) {
	if ( ! src ) {
		return null;
	}

	const source = {
		uri: src,
	};

	return (
		<RNImage
			ref={ ref }
			accessibilityLabel={ alt }
			source={ source }
			{ ...additionalProps }
		/>
	);
}

export default forwardRef( Image );
