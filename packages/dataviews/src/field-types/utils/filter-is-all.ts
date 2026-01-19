/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterIsAll< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	if ( ! filterValue?.length ) {
		return true;
	}

	return filterValue.every( ( value: any ) => {
		return field.getValue( { item } )?.includes( value );
	} );
}
