/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * When the browser is about to auto correct, add an undo level so the user can
 * revert the change.
 */
export function useInsertReplacementText() {
	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );
	return useRefEffect( ( element ) => {
		function onInput( event ) {
			if ( event.inputType === 'insertReplacementText' ) {
				__unstableMarkLastChangeAsPersistent();
			}
		}

		element.addEventListener( 'beforeinput', onInput );
		return () => {
			element.removeEventListener( 'beforeinput', onInput );
		};
	}, [] );
}
