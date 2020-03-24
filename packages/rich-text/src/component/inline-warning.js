/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export function InlineWarning( { forwardedRef } ) {
	useEffect( () => {
		if ( process.env.NODE_ENV === 'development' ) {
			const computedStyle = window.getComputedStyle(
				forwardedRef.current
			);

			if ( computedStyle.display === 'inline' ) {
				// eslint-disable-next-line no-console
				console.warn(
					'RichText cannot be used with an inline container. Please use a different tagName.'
				);
			}
		}
	}, [] );
	return null;
}
