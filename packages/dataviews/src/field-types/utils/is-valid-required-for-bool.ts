/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidRequiredForBool< Item >(
	item: Item,
	field: NormalizedField< Item >
) {
	const value = field.getValue( { item } );

	return value === true;
}
