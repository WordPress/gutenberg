import type { DataViewRenderFieldProps } from '../../types';
import TruncatedValue from '../../components/dataviews-truncated-value';
import RenderFromElements from './render-from-elements';

export default function render( {
	item,
	field,
}: DataViewRenderFieldProps< any > ) {
	return (
		<TruncatedValue>
			{ field.hasElements ? (
				<RenderFromElements item={ item } field={ field } />
			) : (
				field.getValueFormatted( { item, field } )
			) }
		</TruncatedValue>
	);
}
