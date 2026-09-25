import { useLayoutEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';

export function useMarkPersistent( { html, value, getValue } ) {
	const previousTextRef = useRef();
	const hasActiveFormats = !! value.activeFormats?.length;
	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	// Must be set synchronously to make sure it applies to the last change.
	useLayoutEffect( () => {
		// An html change made elsewhere is applied to the rich text record in
		// a layout effect of its own, so the record seen at render time is
		// one change behind it. Read the live record instead.
		const { text } = getValue();

		// Ignore mount.
		if ( ! previousTextRef.current ) {
			previousTextRef.current = text;
			return;
		}

		// Text input, so don't create an undo level for every character.
		// Create an undo level after 1 second of no input.
		if ( previousTextRef.current !== text ) {
			const timeout = window.setTimeout( () => {
				__unstableMarkLastChangeAsPersistent();
			}, 1000 );
			previousTextRef.current = text;
			return () => {
				window.clearTimeout( timeout );
			};
		}

		__unstableMarkLastChangeAsPersistent();
	}, [ html, hasActiveFormats ] );
}
