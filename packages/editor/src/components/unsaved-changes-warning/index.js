import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Warns the user if there are unsaved changes before leaving the editor.
 * Compatible with Post Editor and Site Editor.
 *
 * @return {React.ReactNode} The component.
 */
export default function UnsavedChangesWarning() {
	const { __experimentalGetDirtyEntityRecords } = useSelect( coreStore );

	useEffect( () => {
		/**
		 * Warns the user if there are unsaved changes before leaving the editor.
		 *
		 * @param {BeforeUnloadEvent} event `beforeunload` event.
		 */
		const warnIfUnsavedChanges = ( event ) => {
			// Read the store here instead of subscribing to it. Trashing a post
			// redirects in the same tick it stops being dirty, before this
			// component could re-render, so a subscribed value would be stale.
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			if ( dirtyEntityRecords.length > 0 ) {
				event.preventDefault();
				// Chrome before 119 ignores `preventDefault()`.
				event.returnValue = true;
			}
		};

		window.addEventListener( 'beforeunload', warnIfUnsavedChanges );
		return () => {
			window.removeEventListener( 'beforeunload', warnIfUnsavedChanges );
		};
	}, [ __experimentalGetDirtyEntityRecords ] );

	return null;
}
