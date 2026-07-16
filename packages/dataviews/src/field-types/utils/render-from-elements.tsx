/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps } from '../../types';
import useElements from '../../hooks/use-elements';

export default function RenderFromElements< Item >( {
	item,
	field,
}: DataViewRenderFieldProps< Item > ) {
	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

	const value = field.getValue( { item } );
	if ( isLoading ) {
		return value;
	}

	if ( elements.length === 0 ) {
		return value;
	}

	if ( Array.isArray( value ) ) {
		return value
			.map(
				( entry ) =>
					elements?.find( ( element ) => element.value === entry )
						?.label ?? entry
			)
			.join( ', ' );
	}

	return (
		elements?.find( ( element ) => element.value === value )?.label ||
		field.getValue( { item } )
	);
}
