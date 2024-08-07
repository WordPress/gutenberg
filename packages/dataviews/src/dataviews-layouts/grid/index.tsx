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
import ItemActions from '../../components/dataviews-item-actions';
import SingleSelectionCheckbox from '../../components/dataviews-selection-checkbox';
import { useHasAPossibleBulkAction } from '../../components/dataviews-bulk-actions';
import type { Action, NormalizedField, ViewGridProps } from '../../types';
import type { SetSelection } from '../../private-types';

interface GridItemProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	getItemId: ( item: Item ) => string;
	item: Item;
	actions: Action< Item >[];
	mediaField?: NormalizedField< Item >;
	primaryField?: NormalizedField< Item >;
	visibleFields: NormalizedField< Item >[];
	badgeFields: NormalizedField< Item >[];
	columnFields?: string[];
}

function GridItem< Item >( {
	selection,
	onChangeSelection,
	getItemId,
	item,
	actions,
	mediaField,
	primaryField,
	visibleFields,
	badgeFields,
	columnFields,
}: GridItemProps< Item > ) {
	const hasBulkAction = useHasAPossibleBulkAction( actions, item );
	const id = getItemId( item );
	const isSelected = selection.includes( id );
	const renderedMediaField = mediaField?.render ? (
		<mediaField.render item={ item } />
	) : null;
	const renderedPrimaryField = primaryField?.render ? (
		<primaryField.render item={ item } />
	) : null;
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
					onChangeSelection(
						selection.includes( id )
							? selection.filter( ( itemId ) => id !== itemId )
							: [ ...selection, id ]
					);
				}
			} }
		>
			<div className="dataviews-view-grid__media">
				{ renderedMediaField }
			</div>
			<SingleSelectionCheckbox
				item={ item }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				getItemId={ getItemId }
				primaryField={ primaryField }
				disabled={ ! hasBulkAction }
			/>
			<HStack
				justify="space-between"
				className="dataviews-view-grid__title-actions"
			>
				<HStack className="dataviews-view-grid__primary-field">
					{ renderedPrimaryField }
				</HStack>
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
					{ badgeFields.map( ( field ) => {
						return (
							<FlexItem
								key={ field.id }
								className="dataviews-view-grid__field-value"
							>
								<field.render item={ item } />
							</FlexItem>
						);
					} ) }
				</HStack>
			) }
			{ !! visibleFields?.length && (
				<VStack className="dataviews-view-grid__fields" spacing={ 1 }>
					{ visibleFields.map( ( field ) => {
						return (
							<Flex
								className={ clsx(
									'dataviews-view-grid__field',
									columnFields?.includes( field.id )
										? 'is-column'
										: 'is-row'
								) }
								key={ field.id }
								gap={ 1 }
								justify="flex-start"
								expanded
								style={ { height: 'auto' } }
								direction={
									columnFields?.includes( field.id )
										? 'column'
										: 'row'
								}
							>
								<>
									<FlexItem className="dataviews-view-grid__field-name">
										{ field.label }
									</FlexItem>
									<FlexItem
										className="dataviews-view-grid__field-value"
										style={ { maxHeight: 'none' } }
									>
										<field.render item={ item } />
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
	onChangeSelection,
	selection,
	view,
	density,
}: ViewGridProps< Item > ) {
	const mediaField = fields.find(
		( field ) => field.id === view.layout?.mediaField
	);
	const primaryField = fields.find(
		( field ) => field.id === view.layout?.primaryField
	);
	const viewFields = view.fields || fields.map( ( field ) => field.id );
	const { visibleFields, badgeFields } = fields.reduce(
		( accumulator: Record< string, NormalizedField< Item >[] >, field ) => {
			if (
				! viewFields.includes( field.id ) ||
				[
					view.layout?.mediaField,
					view?.layout?.primaryField,
				].includes( field.id )
			) {
				return accumulator;
			}
			// If the field is a badge field, add it to the badgeFields array
			// otherwise add it to the rest visibleFields array.
			const key = view.layout?.badgeFields?.includes( field.id )
				? 'badgeFields'
				: 'visibleFields';
			accumulator[ key ].push( field );
			return accumulator;
		},
		{ visibleFields: [], badgeFields: [] }
	);
	const hasData = !! data?.length;
	const gridStyle = density
		? { gridTemplateColumns: `repeat(${ density }, minmax(0, 1fr))` }
		: {};
	return (
		<>
			{ hasData && (
				<Grid
					gap={ 8 }
					columns={ 2 }
					alignment="top"
					className="dataviews-view-grid"
					style={ gridStyle }
					aria-busy={ isLoading }
				>
					{ data.map( ( item ) => {
						return (
							<GridItem
								key={ getItemId( item ) }
								selection={ selection }
								onChangeSelection={ onChangeSelection }
								getItemId={ getItemId }
								item={ item }
								actions={ actions }
								mediaField={ mediaField }
								primaryField={ primaryField }
								visibleFields={ visibleFields }
								badgeFields={ badgeFields }
								columnFields={ view.layout?.columnFields }
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
