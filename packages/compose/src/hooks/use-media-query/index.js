/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Runs a media query and returns its value when it changes.
 *
 * @param {string} [query] Media Query.
 * @return {boolean} return value of the media query.
 */
export default function useMediaQuery( query ) {
	const [ match, setMatch ] = useState( false );
	useEffect( () => {
		if ( ! query ) {
			return;
		}
		const updateMatch = () => setMatch( window.matchMedia( query ).matches );
		updateMatch();
		const list = window.matchMedia( query );
		list.addListener( updateMatch );
		return () => {
			list.removeListener( updateMatch );
		};
	}, [ query ] );

	return query && match;
}
