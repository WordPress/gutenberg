/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Tooltip,
} from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ItemActions from './item-actions';

export default function ViewGrid( {
	data,
	fields,
	view,
	actions,
	getItemId,
	deferredRendering,
	selection,
	onSelectionChange,
} ) {
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
	const usedData = deferredRendering ? shownData : data;
	return (
		<Grid
			gap={ 6 }
			columns={ 2 }
			alignment="top"
			className="dataviews-view-grid"
		>
			{ usedData.map( ( item ) => {
				const id = getItemId( item );
				const isSelected = selection.includes( getItemId( item ) );
				return (
					<VStack
						spacing={ 0 }
						key={ id }
						className={ classnames( 'dataviews-view-grid__card', {
							'is-selected': isSelected,
						} ) }
						onClick={ ( event ) => {
							if ( event.ctrlKey || event.metaKey ) {
								if ( ! isSelected ) {
									onSelectionChange(
										data.filter( ( _item ) => {
											const itemId = getItemId?.( _item );
											return (
												itemId === id ||
												selection.includes( itemId )
											);
										} )
									);
								} else {
									onSelectionChange(
										data.filter( ( _item ) => {
											const itemId = getItemId?.( _item );
											return (
												itemId !== id &&
												selection.includes( itemId )
											);
										} )
									);
								}
							}
						} }
					>
						<div className="dataviews-view-grid__media">
							{ mediaField?.render( { item } ) }
						</div>
						<HStack
							justify="space-between"
							className="dataviews-view-grid__title-actions"
						>
							<HStack className="dataviews-view-grid__primary-field">
								{ primaryField?.render( { item } ) }
							</HStack>
							<ItemActions
								item={ item }
								actions={ actions }
								isCompact
							/>
						</HStack>
						<VStack
							className="dataviews-view-grid__fields"
							spacing={ 3 }
						>
							{ visibleFields.map( ( field ) => {
								const renderedValue = field.render( {
									item,
								} );
								if ( ! renderedValue ) {
									return null;
								}
								return (
									<VStack
										className="dataviews-view-grid__field"
										key={ field.id }
										spacing={ 1 }
									>
										<Tooltip
											text={ field.header }
											placement="left"
										>
											<div className="dataviews-view-grid__field-value">
												{ renderedValue }
											</div>
										</Tooltip>
									</VStack>
								);
							} ) }
						</VStack>
					</VStack>
				);
			} ) }
		</Grid>
	);
}
