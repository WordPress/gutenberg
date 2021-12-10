/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLocation } from './index';

export default function useResetFocusOnRouteChange( targetRef ) {
	const location = useLocation();
	const isInitialPageLoadRef = useRef( true );

	useEffect( () => {
		// Don't focus for initial page load.
		if ( isInitialPageLoadRef.current ) {
			isInitialPageLoadRef.current = false;
			return;
		}

		targetRef.current?.focus();
	}, [ location, targetRef ] );
}
