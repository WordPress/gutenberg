/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export function InlineWarning( { forwardedRef } ) {
	useEffect( () => {
		if ( process.env.NODE_ENV === 'development' ) {
			const target = forwardedRef.current;
			const { defaultView } = target.ownerDocument;
			const computedStyle = defaultView.getComputedStyle( target );

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
