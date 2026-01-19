/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterStartsWith< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	if ( filterValue === undefined ) {
		return true;
	}

	const fieldValue = field.getValue( { item } );

	return (
		typeof fieldValue === 'string' &&
		filterValue &&
		fieldValue
			.toLowerCase()
			.startsWith( String( filterValue ).toLowerCase() )
	);
}
