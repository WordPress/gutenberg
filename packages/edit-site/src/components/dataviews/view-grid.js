/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Tooltip,
	VisuallyHidden,
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
	const primaryField = fields.find(
		( field ) => field.id === view.layout.primaryField
	);
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			! [ view.layout.mediaField, view.layout.primaryField ].includes(
				field.id
			)
	);
	const shownData = useAsyncList( data, { step: 3 } );
	return (
		<Grid
			gap={ 8 }
			columns={ 2 }
			alignment="top"
			className="dataviews-grid-view"
		>
			{ shownData.map( ( item, index ) => (
				<VStack
					key={ getItemId?.( item ) || index }
					className="dataviews-view-grid__card"
				>
					<div className="dataviews-view-grid__media">
						{ mediaField?.render( { item, view } ) }
					</div>
					<HStack justify="space-between">
						{ primaryField?.render( { item, view } ) }
						<ItemActions
							item={ item }
							actions={ actions }
							isCompact
						/>
					</HStack>
					<div className="dataviews-view-grid__fields">
						{ visibleFields.map( ( field ) => (
							<div
								className="dataviews-view-grid__field"
								key={ field.id }
							>
								<VisuallyHidden>
									{ field.header }
								</VisuallyHidden>
								<span className="dataviews-view-grid__field-value">
									<Tooltip
										text={ field.header }
										placement="top"
									>
										<span>
											{ field.render( { item, view } ) }
										</span>
									</Tooltip>
								</span>
							</div>
						) ) }
					</div>
				</VStack>
			) ) }
		</Grid>
	);
}
