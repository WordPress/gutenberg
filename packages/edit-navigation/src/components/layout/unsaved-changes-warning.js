/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Warns the user if there are unsaved changes before leaving the editor.
 *
 * This is a duplicate of the component implemented in the editor package.
 * Duplicated here as edit-navigation doesn't depend on editor.
 *
 * @return {WPComponent} The component.
 */
export default function UnsavedChangesWarning() {
	const isDirty = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords } = select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		return dirtyEntityRecords.length > 0;
	}, [] );

	useEffect( () => {
		/**
		 * Warns the user if there are unsaved changes before leaving the editor.
		 *
		 * @param {Event} event `beforeunload` event.
		 *
		 * @return {?string} Warning prompt message, if unsaved changes exist.
		 */
		const warnIfUnsavedChanges = ( event ) => {
			if ( isDirty ) {
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
	}, [ isDirty ] );

	return null;
}
