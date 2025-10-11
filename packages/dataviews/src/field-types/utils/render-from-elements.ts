/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps } from '../../types';
import { useFieldElements } from '../../hooks/use-field-elements';

function RenderFromElementsComponent< Item >( {
	item,
	field,
}: DataViewRenderFieldProps< Item > ) {
	const { elements } = useFieldElements( field.elements );
	const value = field.getValue( { item } );

	if ( Array.isArray( value ) ) {
		if ( elements.length === 0 ) {
			return value.join( ', ' );
		}

		return value
			.map( ( member ) => {
				const match = elements.find(
					( element ) => element.value === member
				);
				return match?.label ?? member;
			} )
			.join( ', ' );
	}

	const match = elements.find( ( element ) => element.value === value );
	return match?.label ?? value ?? null;
}

export default function renderFromElements< Item >(
	props: DataViewRenderFieldProps< Item >
) {
	return createElement( RenderFromElementsComponent< Item >, props );
}
