/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexBlock,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ItemActions from './item-actions';

export function ViewMedia( { data, fields, view, actions } ) {
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			field.id !== view.layout.mediaField
	);
	return (
		<Grid gap={ 8 } columns={ 3 } alignment="top">
			{ data.map( ( item, index ) => {
				return (
					<VStack
						key={ index }
						justify="space-between"
						alignment="top"
						className="edit-site-dataview-view-media-item"
					>
						{ visibleFields.map( ( field ) => (
							<div key={ field.id }>
								{ field.render( { item, view } ) }
							</div>
						) ) }
						<ItemActions
							item={ item }
							actions={ actions }
						/>
					</VStack>
				);
			} ) }
		</Grid>
	);
}
