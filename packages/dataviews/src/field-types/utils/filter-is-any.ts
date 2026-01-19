/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterIsAny< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	if ( ! filterValue?.length ) {
		return true;
	}

	const fieldValue = field.getValue( { item } );

	if ( Array.isArray( fieldValue ) ) {
		return filterValue.some( ( fv: any ) => fieldValue.includes( fv ) );
	} else if ( typeof fieldValue === 'string' ) {
		return filterValue.includes( fieldValue );
	}

	return false;
}
