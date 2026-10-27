import type { NormalizedField, View } from '../types';

/**
 * Returns the fields the user can show or hide, sorted alphabetically by label.
 *
 * @param view   The current view.
 * @param fields The normalized fields.
 *
 * @return The hideable fields, sorted by label.
 */
export default function getHideableFields< Item >(
	view: View,
	fields: NormalizedField< Item >[]
): NormalizedField< Item >[] {
	const togglableFields = [
		view?.titleField,
		view?.mediaField,
		view?.descriptionField,
	].filter( Boolean );
	return fields
		.filter(
			( f ) =>
				! togglableFields.includes( f.id ) &&
				f.type !== 'media' &&
				f.enableHiding !== false
		)
		.sort( ( a, b ) => a.label.localeCompare( b.label ) );
}
