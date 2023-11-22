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
							{ /* TODO: This needs to be handled better because it could be not possible to
								to return `null`, if the field needs to provide a component that uses hooks, etc..
								In that case, the actual field could render nothing, but the `mediaField?.render`
								call would return a React element.
							*/ }
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
							{ /* TODO: ItemActions needs to be handled better in general.
							In smaller viewports the actions could take too much space.
							A solution could be to render the actions inside the media,
							or in `grid` render all actions in the drop down menu. */ }
							<FlexBlock style={ { maxWidth: 'min-content' } }>
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
