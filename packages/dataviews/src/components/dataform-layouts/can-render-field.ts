import type { NormalizedField } from '../../types';

/**
 * Whether a field can render its read-only value or an edit control.
 *
 * @param field The normalized field definition.
 * @return Whether the field can render.
 */
export function canRenderField< Item >(
	field: NormalizedField< Item > | undefined
): field is NormalizedField< Item > {
	return !! field && ( field.readOnly === true || !! field.Edit );
}
