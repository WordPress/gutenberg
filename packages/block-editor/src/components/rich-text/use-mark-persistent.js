/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useMarkPersistent( { html, value } ) {
	const previousTextRef = useRef();
	const hasActiveFormats = !! value.activeFormats?.length;
	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	// Must be set synchronously to make sure it applies to the last change.
	useLayoutEffect( () => {
		// Ignore mount.
		if ( ! previousTextRef.current ) {
			previousTextRef.current = value.text;
			return;
		}

		// Text input, so don't create an undo level for every character.
		// Create an undo level after 1 second of no input.
		if ( previousTextRef.current !== value.text ) {
			const timeout = window.setTimeout( () => {
				__unstableMarkLastChangeAsPersistent();
			}, 1000 );
			previousTextRef.current = value.text;
			return () => {
				window.clearTimeout( timeout );
			};
		}

		__unstableMarkLastChangeAsPersistent();
	}, [ html, hasActiveFormats ] );
}
