import type { NormalizedField, View } from '../../../types';

/**
 * Returns the ids in `view.fields` that have a field definition, in view
 * order. The table layouts render one column per id, so an id with no
 * definition (a stale persisted view, or a server-provided default that
 * names a field the consumer never registered) would otherwise produce an
 * empty column with no header, no cells and no menu.
 *
 * @param view   The view.
 * @param fields The normalized fields.
 * @return The ids of the columns to render.
 */
export default function getTableColumns< Item >(
	view: View,
	fields: NormalizedField< Item >[]
): string[] {
	return ( view.fields ?? [] ).filter( ( fieldId ) =>
		fields.some( ( field ) => field.id === fieldId )
	);
}
