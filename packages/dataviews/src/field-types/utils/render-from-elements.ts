/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps } from '../../types';

export default function renderFromElements< Item >( {
	item,
	field,
}: DataViewRenderFieldProps< Item > ) {
	const value = field.getValue( { item } );
	const elements = Array.isArray( field?.elements ) ? field.elements : [];
	return (
		elements.find( ( element ) => element.value === value )?.label ||
		field.getValue( { item } )
	);
}
