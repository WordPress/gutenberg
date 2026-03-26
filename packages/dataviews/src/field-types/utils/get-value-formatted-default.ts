import type { NormalizedField } from '../../types';

function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	return field.getValue( { item } );
}

export default getValueFormatted;
