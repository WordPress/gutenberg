/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps } from '../../types';
import RenderFromElements from './render-from-elements';

export default function render( {
	item,
	field,
}: DataViewRenderFieldProps< any > ) {
	return field.hasElements ? (
		<RenderFromElements item={ item } field={ field } />
	) : (
		field.getValue( { item } )
	);
}
