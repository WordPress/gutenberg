/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterLessThan< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	if ( filterValue === undefined ) {
		return true;
	}

	const fieldValue = field.getValue( { item } );

	return fieldValue < filterValue;
}
