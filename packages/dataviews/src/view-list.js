/**
 * WordPress dependencies
 */
import { useAsyncList } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

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
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			view.layout.primaryField !== field.id
	);

	return (
		<ul className="dataviews-list-view">
			{ shownData.map( ( item, index ) => {
				return (
					// TODO: make li interactive.
					/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
					<li
						key={ getItemId?.( item ) || index }
						onClick={ () => onSelectionChange( [ item ] ) }
					>
						<VStack>
							{ primaryField?.render( { item } ) }
							<HStack
								alignment="left"
								className="dataviews-list-view__fields"
							>
								{ visibleFields.map( ( field ) => {
									return (
										<span key={ field.id }>
											{ field.render( { item } ) }
										</span>
									);
								} ) }
							</HStack>
						</VStack>
					</li>
					/* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
				);
			} ) }
		</ul>
	);
}
