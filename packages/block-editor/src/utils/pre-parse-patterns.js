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
	const { patterns, isPreviewMode } = useSelect( ( _select ) => {
		const { __experimentalBlockPatterns, __unstableIsPreviewMode } =
			_select( blockEditorStore ).getSettings();
		return {
			patterns: __experimentalBlockPatterns,
			isPreviewMode: __unstableIsPreviewMode,
		};
	}, [] );

	useEffect( () => {
		if ( isPreviewMode ) {
			return;
		}
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

			select( blockEditorStore ).__experimentalGetParsedPattern(
				patterns[ index ].name
			);

			handle = requestIdleCallback( callback );
		};

		handle = requestIdleCallback( callback );
		return () => cancelIdleCallback( handle );
	}, [ patterns, isPreviewMode ] );

	return null;
}
