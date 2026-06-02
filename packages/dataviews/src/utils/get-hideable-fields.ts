/**
 * Internal dependencies
 */
import type { NormalizedField, View } from '../types';

export default function getHideableFields< Item >(
	view: View,
	fields: NormalizedField< Item >[]
): NormalizedField< Item >[] {
	const togglableFields = [
		view?.titleField,
		view?.mediaField,
		view?.descriptionField,
	].filter( Boolean );
	return fields.filter(
		( f ) =>
			! togglableFields.includes( f.id ) &&
			f.type !== 'media' &&
			f.enableHiding !== false
	);
}
