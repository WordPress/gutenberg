/**
 * Internal dependencies
 */
import type { NormalizedField } from './types';

interface FieldFormatPrimaryProps< Item > {
	field: NormalizedField< Item >;
	item: Item;
	id?: string;
}

export default function FieldFormatPrimary< Item >( {
	field,
	item,
	id,
}: FieldFormatPrimaryProps< Item > ) {
	return (
		<div className="dataviews-field-format-primary" id={ id }>
			{ field.render( { item } ) }
		</div>
	);
}
