/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export const FullscreenMode = ( { isActive } ) => {
	const [ isSticky, setIsSticky ] = useState( false );

	// componentDidMount
	useEffect( () => {
		// `is-fullscreen-mode` is set in PHP as a body class by Gutenberg, and this causes
		// `sticky-menu` to be applied by WordPress and prevents the admin menu being scrolled
		// even if `is-fullscreen-mode` is then removed. Let's remove `sticky-menu` here as
		// a consequence of the FullscreenMode setup
		if ( document.body.classList.contains( 'sticky-menu' ) ) {
			setIsSticky( true );
			document.body.classList.remove( 'sticky-menu' );
		}
	}, [ setIsSticky ] );

	// componentWillUnmount
	useEffect( () => {
		return () => {
			if ( isSticky ) {
				document.body.classList.add( 'sticky-menu' );
			}
		};
	}, [ isSticky ] );

	useEffect( () => {
		return () => {
			if ( isActive ) {
				document.body.classList.remove( 'is-fullscreen-mode' );
			}
		};
	}, [ isActive ] );

	// componentDidUpdate
	useEffect( () => {
		if ( isActive ) {
			document.body.classList.add( 'is-fullscreen-mode' );
		} else {
			document.body.classList.remove( 'is-fullscreen-mode' );
		}
	}, [ isActive ] );

	return null;
};
