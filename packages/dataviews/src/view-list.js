/**
 * WordPress dependencies
 */
import { useAsyncList } from '@wordpress/compose';
import { Icon, __experimentalHStack as HStack } from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

export default function ViewList( {
	view,
	fields,
	data,
	getItemId,
	onSelectionChange,
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
					/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
					<li
						key={ getItemId?.( item ) || index }
						onClick={ () => {
							onSelectionChange( [ item ] );
						} }
					>
						<HStack>
							{ primaryField?.render( { item } ) }
							<Icon icon={ chevronRight } />
						</HStack>
					</li>
					/* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
				);
			} ) }
		</ul>
	);
}
