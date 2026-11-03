import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Warns the user before they leave the page while there are unsaved changes.
 *
 * It does the same as `UnsavedChangesWarning` from `@wordpress/editor`, which
 * boot does not import so that screens without an editor do not load it.
 *
 * @return Nothing, it only listens for the page being left.
 */
export default function UnsavedChangesWarning() {
	const { __experimentalGetDirtyEntityRecords } = useSelect( coreStore );

	useEffect( () => {
		const warnIfUnsavedChanges = ( event: BeforeUnloadEvent ) => {
			// Read the records when the page is left, not when rendering, so
			// that a record trashed in the meantime is not counted.
			if ( __experimentalGetDirtyEntityRecords().length > 0 ) {
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
