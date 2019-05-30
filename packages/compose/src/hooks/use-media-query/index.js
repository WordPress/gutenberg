/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Runs a media query and returns its value when it changes.
 *
 * @param {string} query Media Query.
 * @return {boolean} return value of the media query.
 */
export default function useMediaQuery( query ) {
	const [ match, setMatch ] = useState( false );
	useEffect( () => {
		const updateMatch = () => setMatch( window.matchMedia( query ).matches );
		updateMatch();
		window.matchMedia( query ).addEventListener( 'change', updateMatch );
		return () => {
			window.matchMedia( query ).removeEventListener( 'change', updateMatch );
		};
	}, [ query ] );

	return match;
}
