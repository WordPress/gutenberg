/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexBlock,
	Placeholder,
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
	console.log( 'data, fields, view, actions', data, fields, view, actions );
	return (
		<Grid gap={ 8 } columns={ 2 } alignment="top">
			{ data.map( ( item, index ) => {
				return (
					<VStack key={ index }>
						<div className="dataviews-view-grid__media">

						</div>

						<HStack justify="space-between" alignment="top">
							<FlexBlock>
								<VStack>
									{ visibleFields.map( ( field ) => (
										<div key={ field.id }>
											{ field.render( { item, view } ) }
										</div>
									) ) }
								</VStack>
							</FlexBlock>
							<FlexBlock>
								<ItemActions
									item={ item }
									actions={ actions }
								/>
							</FlexBlock>
						</HStack>
					</VStack>
				);
			} ) }
		</Grid>
	);
}
