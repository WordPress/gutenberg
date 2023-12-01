/**
 * WordPress dependencies
 */
import { useAsyncList } from '@wordpress/compose';
import { Icon,
	__experimentalHStack as HStack,} from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

export default function ViewList( {
	view,
	fields,
	data,
	getItemId,
	onClickPreviewField,
} ) {
	const shownData = useAsyncList( data, { step: 3 } );
	const previewField = fields.find(
		( field ) => field.id === view.layout.previewField
	);
	return (
		<ul className="dataviews-list-view">
			{ shownData.map( ( item, index ) => {
				return (
					<li key={ getItemId?.( item ) || index } onClick={ () => {
						onClickPreviewField( item );
					}}>
						<HStack>
						{ previewField?.render( { item } ) }
						<Icon icon={ chevronRight } />
						</HStack>
					</li>
				);
			} ) }
		</ul>
	);
}
