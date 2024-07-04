/**
 * Internal dependencies
 */
import type { NormalizedField } from './types';

interface FieldRenderPrimaryProps< Item > {
	field: NormalizedField< Item >;
	item: Item;
	id?: string;
}

export default function FieldRenderPrimary< Item >( {
	field,
	item,
	id,
}: FieldRenderPrimaryProps< Item > ) {
	return (
		<div className="dataviews-field-render-primary" id={ id }>
			{ field.render( { item } ) }
		</div>
	);
}
