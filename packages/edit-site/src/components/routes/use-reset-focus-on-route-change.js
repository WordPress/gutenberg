/**
 * External dependencies
 */
import { Action } from 'history';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLocation, useHistory } from './index';

export default function useResetFocusOnRouteChange( targetRef ) {
	const history = useHistory();
	const location = useLocation();
	const isInitialPageLoadRef = useRef( true );
	const expectRedirectionRef = useRef( false );

	useEffect( () => {
		// Don't focus for initial page load.
		if ( isInitialPageLoadRef.current ) {
			isInitialPageLoadRef.current = false;
			expectRedirectionRef.current = true;
			return;
		}
		// Don't focus for the initial page redirection.
		// TODO: This can be removed once #36873 is resolved.
		if ( expectRedirectionRef.current ) {
			expectRedirectionRef.current = false;
			if ( history.action === Action.Replace ) {
				return;
			}
		}

		const activeElement = targetRef.current?.ownerDocument.activeElement;

		// Don't refocus if the activeElement is still on the page (like NavLink).
		if ( ! activeElement || activeElement === document.body ) {
			targetRef.current?.focus();
		}
	}, [ location, targetRef, history ] );
}
