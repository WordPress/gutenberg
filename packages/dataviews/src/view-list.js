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
	onClickPreview,
} ) {
	const shownData = useAsyncList( data, { step: 3 } );
	const primaryField = fields.find(
		( field ) => field.id === view.layout.primaryField
	);
	return (
		<ul className="dataviews-list-view">
			{ shownData.map( ( item, index ) => {
				return (
					// TODO: make li interactive.
					// fix jsx-a11y/click-events-have-key-events and jsx-a11y/no-noninteractive-element-interactions
					<li key={ getItemId?.( item ) || index } onClick={ () => {
						onClickPreview( item );
					}}>
						<HStack>
						{ primaryField?.render( { item } ) }
						<Icon icon={ chevronRight } />
						</HStack>
					</li>
				);
			} ) }
		</ul>
	);
}
