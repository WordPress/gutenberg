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
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ItemActions from './item-actions';

export function ViewGrid( { data, fields, view, actions, getItemId } ) {
	const mediaField = fields.find(
		( field ) => field.id === view.layout.mediaField
	);
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			field.id !== view.layout.mediaField
	);
	const shownData = useAsyncList( data, { step: 3 } );
	return (
		<Grid
			gap={ 8 }
			columns={ 2 }
			alignment="top"
			className="dataviews-grid-view"
		>
			{ shownData.map( ( item, index ) => {
				return (
					<VStack key={ getItemId?.( item ) || index }>
						<div className="dataviews-view-grid__media">
							{ mediaField?.render( { item, view } ) || (
								<Placeholder
									withIllustration
									style={ {
										width: '100%',
										minHeight: '200px',
									} }
								/>
							) }
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
							<FlexBlock style={ { maxWidth: 'min-content' } }>
								<ItemActions
									item={ item }
									actions={ actions }
									viewType={ view.type }
								/>
							</FlexBlock>
						</HStack>
					</VStack>
				);
			} ) }
		</Grid>
	);
}
