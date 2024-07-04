/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Spinner,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ItemActions from './item-actions';
import SingleSelectionCheckbox from './single-selection-checkbox';
import { useHasAPossibleBulkAction } from './bulk-actions';
import type {
	Action,
	NormalizedField,
	NormalizedFieldRenderConfig,
	ViewProps,
} from './types';
import type { SetSelection } from './private-types';
import { normalizeFieldRenderConfigs } from './normalize-field-render-configs';
import FieldRenderPrimary from './field-render-primary';

interface GridItemProps< Item > {
	selection: string[];
	onSelectionChange: SetSelection;
	getItemId: ( item: Item ) => string;
	item: Item;
	fields: NormalizedField< Item >[];
	actions: Action< Item >[];
	mediaField?: NormalizedField< Item >;
	primaryField?: NormalizedField< Item >;
	groupedRenderFields: Record< string, NormalizedFieldRenderConfig[] >;
}

function GridItem< Item >( {
	selection,
	onSelectionChange,
	getItemId,
	item,
	actions,
	fields,
	mediaField,
	primaryField,
	groupedRenderFields,
}: GridItemProps< Item > ) {
	const hasBulkAction = useHasAPossibleBulkAction( actions, item );
	const id = getItemId( item );
	const isSelected = selection.includes( id );
	const badgeFields = groupedRenderFields.badge;
	const defaultFields = groupedRenderFields.default;
	return (
		<VStack
			spacing={ 0 }
			key={ id }
			className={ clsx( 'dataviews-view-grid__card', {
				'is-selected': hasBulkAction && isSelected,
			} ) }
			onClickCapture={ ( event ) => {
				if ( event.ctrlKey || event.metaKey ) {
					event.stopPropagation();
					event.preventDefault();
					if ( ! hasBulkAction ) {
						return;
					}
					onSelectionChange(
						selection.includes( id )
							? selection.filter( ( itemId ) => id !== itemId )
							: [ ...selection, id ]
					);
				}
			} }
		>
			<div className="dataviews-view-grid__media">
				{ mediaField?.render( { item } ) }
			</div>
			<HStack
				justify="space-between"
				className="dataviews-view-grid__title-actions"
				alignment="center"
			>
				<SingleSelectionCheckbox
					item={ item }
					selection={ selection }
					onSelectionChange={ onSelectionChange }
					getItemId={ getItemId }
					primaryField={ primaryField }
					disabled={ ! hasBulkAction }
				/>
				{ !! primaryField && (
					<FieldRenderPrimary item={ item } field={ primaryField } />
				) }
				<ItemActions item={ item } actions={ actions } isCompact />
			</HStack>
			{ !! badgeFields?.length && (
				<HStack
					className="dataviews-view-grid__badge-fields"
					spacing={ 2 }
					wrap
					alignment="top"
					justify="flex-start"
				>
					{ fields.map( ( field ) => {
						const isVisible = !! badgeFields.find(
							( fr ) => field.id === fr.field
						);
						if ( ! isVisible ) {
							return null;
						}
						const renderedValue = field.render( {
							item,
						} );
						if ( ! renderedValue ) {
							return null;
						}
						return (
							<FlexItem
								key={ field.id }
								className="dataviews-view-grid__field-value"
							>
								{ renderedValue }
							</FlexItem>
						);
					} ) }
				</HStack>
			) }
			{ !! defaultFields?.length && (
				<VStack className="dataviews-view-grid__fields" spacing={ 3 }>
					{ fields.map( ( field ) => {
						const isVisible = !! defaultFields.find(
							( fr ) => field.id === fr.field
						);
						if ( ! isVisible ) {
							return null;
						}
						const renderedValue = field.render( {
							item,
						} );
						if ( ! renderedValue ) {
							return null;
						}
						return (
							<Flex
								className="dataviews-view-grid__field"
								key={ field.id }
								gap={ 1 }
								justify="flex-start"
								expanded
								style={ { height: 'auto' } }
							>
								<>
									<FlexItem className="dataviews-view-grid__field-name">
										{ field.header }
									</FlexItem>
									<FlexItem
										className="dataviews-view-grid__field-value"
										style={ { maxHeight: 'none' } }
									>
										{ renderedValue }
									</FlexItem>
								</>
							</Flex>
						);
					} ) }
				</VStack>
			) }
		</VStack>
	);
}

export default function ViewGrid< Item >( {
	actions,
	data,
	fields,
	getItemId,
	isLoading,
	onSelectionChange,
	selection,
	view,
}: ViewProps< Item > ) {
	const fieldRenderConfigs = normalizeFieldRenderConfigs(
		view.fields,
		fields
	);
	const mediaFieldId = fieldRenderConfigs.find(
		( fieldRender ) => fieldRender.render === 'media'
	)?.field;
	const primaryFieldId = fieldRenderConfigs.find(
		( fieldRender ) => fieldRender.render === 'primary'
	)?.field;
	const mediaField = fields.find( ( f ) => f.id === mediaFieldId );
	const primaryField = fields.find( ( f ) => f.id === primaryFieldId );
	const groupedFields = fieldRenderConfigs.reduce(
		(
			accumulator: Record< string, NormalizedFieldRenderConfig[] >,
			fieldRender
		) => {
			if (
				[ mediaFieldId, primaryFieldId ].includes( fieldRender.field )
			) {
				return accumulator;
			}
			accumulator[ fieldRender.render ].push( fieldRender );
			return accumulator;
		},
		{ default: [], badge: [], column: [] }
	);
	const hasData = !! data?.length;
	return (
		<>
			{ hasData && (
				<Grid
					gap={ 8 }
					columns={ 2 }
					alignment="top"
					className="dataviews-view-grid"
					aria-busy={ isLoading }
				>
					{ data.map( ( item ) => {
						return (
							<GridItem
								key={ getItemId( item ) }
								selection={ selection }
								onSelectionChange={ onSelectionChange }
								getItemId={ getItemId }
								item={ item }
								actions={ actions }
								fields={ fields }
								mediaField={ mediaField }
								primaryField={ primaryField }
								groupedRenderFields={ groupedFields }
							/>
						);
					} ) }
				</Grid>
			) }
			{ ! hasData && (
				<div
					className={ clsx( {
						'dataviews-loading': isLoading,
						'dataviews-no-results': ! isLoading,
					} ) }
				>
					<p>{ isLoading ? <Spinner /> : __( 'No results' ) }</p>
				</div>
			) }
		</>
	);
}
