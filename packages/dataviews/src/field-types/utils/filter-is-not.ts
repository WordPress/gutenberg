/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterIsNot< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	return filterValue !== field.getValue( { item } );
}
