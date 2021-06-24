/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

const FullscreenMode = ( { isActive } ) => {
	const isSticky = useRef( false );

	useEffect( () => {
		// `is-fullscreen-mode` is set in PHP as a body class by Gutenberg, and this causes
		// `sticky-menu` to be applied by WordPress and prevents the admin menu being scrolled
		// even if `is-fullscreen-mode` is then removed. Let's remove `sticky-menu` here as
		// a consequence of the FullscreenMode setup
		if ( document.body.classList.contains( 'sticky-menu' ) ) {
			isSticky.current = true;
			document.body.classList.remove( 'sticky-menu' );
		}
	}, [] );

	useEffect( () => {
		return () => {
			if ( isSticky.current ) {
				document.body.classList.add( 'sticky-menu' );
			}
		};
	}, [ isSticky ] );

	useEffect( () => {
		if ( isActive ) {
			document.body.classList.add( 'is-fullscreen-mode' );
		} else {
			document.body.classList.remove( 'is-fullscreen-mode' );
		}

		return () => {
			if ( isActive ) {
				document.body.classList.remove( 'is-fullscreen-mode' );
			}
		};
	}, [ isActive ] );

	return null;
};
export default FullscreenMode;
