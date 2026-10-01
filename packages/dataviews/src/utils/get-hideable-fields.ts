import type { NormalizedField, View } from '../types';

/**
 * Returns the fields the user can show or hide, sorted alphabetically by label.
 *
 * The order in which a consumer declares the fields is an implementation
 * detail of that consumer, so the lists that let the user pick a field —
 * the view config's properties section and the table's insert column
 * submenus — present them alphabetically instead.
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
