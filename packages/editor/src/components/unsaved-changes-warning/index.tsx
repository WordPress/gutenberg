import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';

const { UnsavedChangesWarning: CoreUnsavedChangesWarning } =
	unlock( coreDataPrivateApis );

/**
 * Warns the user if there are unsaved changes before leaving the editor.
 * Compatible with Post Editor and Site Editor.
 *
 * @return The component.
 */
export default function UnsavedChangesWarning() {
	return <CoreUnsavedChangesWarning />;
}
