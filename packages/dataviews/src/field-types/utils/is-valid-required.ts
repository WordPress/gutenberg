/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidRequired< Item >(
	item: Item,
	field: NormalizedField< Item >
) {
	const value = field.getValue( { item } );

	return ! [ undefined, '', null ].includes( value );
}
