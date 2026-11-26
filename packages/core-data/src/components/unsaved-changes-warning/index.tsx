import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../name';
import type { store as coreStore } from '../../';

/**
 * Warns the user if there are unsaved changes before leaving the editor.
 * Compatible with Post Editor and Site Editor.
 *
 * @return The component.
 */
export default function UnsavedChangesWarning() {
	const { __experimentalGetDirtyEntityRecords } = useSelect(
		STORE_NAME as unknown as typeof coreStore
	);

	useEffect( () => {
		/**
		 * Warns the user if there are unsaved changes before leaving the editor.
		 *
		 * @param event `beforeunload` event.
		 *
		 * @return Warning prompt message, if unsaved changes exist.
		 */
		const warnIfUnsavedChanges = ( event: BeforeUnloadEvent ) => {
			// We need to call the selector directly in the listener to avoid race
			// conditions with `BrowserURL` where `componentDidUpdate` gets the
			// new value of `isEditedPostDirty` before this component does,
			// causing this component to incorrectly think a trashed post is still dirty.
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			if ( dirtyEntityRecords.length > 0 ) {
				event.returnValue = __(
					'You have unsaved changes. If you proceed, they will be lost.'
				);
				return event.returnValue;
			}
		};

		window.addEventListener( 'beforeunload', warnIfUnsavedChanges );

		return () => {
			window.removeEventListener( 'beforeunload', warnIfUnsavedChanges );
		};
	}, [ __experimentalGetDirtyEntityRecords ] );

	return null;
}
