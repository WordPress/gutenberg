/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export function Image( { src, alt, ...additionalProps }, ref ) {
	if ( ! src ) {
		return null;
	}

	return (
		<img
			ref={ ref }
			alt={ alt }
			src={ src }
			{ ...additionalProps }
		/>
	);
}

export default forwardRef( Image );
