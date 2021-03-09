/**
 * WordPress dependencies
 */
import { useSelect, select } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

const requestIdleCallback = ( () => {
	if ( typeof window === 'undefined' ) {
		return ( callback ) => {
			setTimeout( () => callback( Date.now() ), 0 );
		};
	}

	return window.requestIdleCallback || window.requestAnimationFrame;
} )();

const cancelIdleCallback = ( () => {
	if ( typeof window === 'undefined' ) {
		return clearTimeout;
	}

	return window.cancelIdleCallback || window.cancelAnimationFrame;
} )();

export function usePreParsePatterns() {
	const patterns = useSelect(
		( _select ) =>
			_select( blockEditorStore ).getSettings()
				.__experimentalBlockPatterns,
		[]
	);

	useEffect( () => {
		if ( ! patterns?.length ) {
			return;
		}

		let handle;
		let index = -1;

		const callback = () => {
			index++;
			if ( index >= patterns.length ) {
				return;
			}

			const marker = `[usePreParsePatterns] process ${ index } ${ patterns[ index ]?.name }`;
			window.console.time( marker );
			select( blockEditorStore ).__experimentalGetParsedPattern(
				patterns[ index ].name,
				index
			);
			window.console.timeEnd( marker );

			handle = requestIdleCallback( callback );
		};

		window.console.time( '[usePreParsePatterns] initiate' );
		window.console.timeEnd( '[usePreParsePatterns] initiate' );

		handle = requestIdleCallback( callback );
		return () => cancelIdleCallback( handle );
	}, [ patterns ] );

	return null;
}
