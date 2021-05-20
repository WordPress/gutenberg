/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

const message =
	'RichText cannot be used with an inline container. Please use a different display property.';

export function useInlineWarning() {
	const ref = useRef();
	useEffect( () => {
		if ( process.env.NODE_ENV === 'development' ) {
			const target = ref.current;
			const { defaultView } = target.ownerDocument;
			const computedStyle = defaultView.getComputedStyle( target );

			if ( computedStyle.display === 'inline' ) {
				// eslint-disable-next-line no-console
				console.error( message );
			}
		}
	}, [] );
	return ref;
}
