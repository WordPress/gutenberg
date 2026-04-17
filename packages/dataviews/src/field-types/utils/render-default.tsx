/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps } from '../../types';
import RenderFromElements from './render-from-elements';

export default function render( {
	item,
	field,
}: DataViewRenderFieldProps< any > ) {
	if ( field.hasElements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	return field.getValueFormatted( { item, field } );
}
