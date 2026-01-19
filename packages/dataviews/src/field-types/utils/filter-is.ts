/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterIs< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	return (
		filterValue === field.getValue( { item } ) || filterValue === undefined
	);
}
