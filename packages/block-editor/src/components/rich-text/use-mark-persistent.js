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
	const previousText = useRef();
	const hasActiveFormats =
		value.activeFormats && !! value.activeFormats.length;
	const { __unstableMarkLastChangeAsPersistent } = useDispatch(
		blockEditorStore
	);

	// Must be set synchronously to make sure it applies to the last change.
	useLayoutEffect( () => {
		// Ignore mount.
		if ( ! previousText.current ) {
			previousText.current = value.text;
			return;
		}

		// Text input, so don't create an undo level for every character.
		// Create an undo level after 1 second of no input.
		if ( previousText.current !== value.text ) {
			const timeout = window.setTimeout( () => {
				__unstableMarkLastChangeAsPersistent();
			}, 1000 );
			previousText.current = value.text;
			return () => {
				window.clearTimeout( timeout );
			};
		}

		__unstableMarkLastChangeAsPersistent();
	}, [ html, hasActiveFormats ] );
}
