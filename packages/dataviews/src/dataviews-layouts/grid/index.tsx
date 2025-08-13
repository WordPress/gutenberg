/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Spinner,
	Flex,
	FlexItem,
	Tooltip,
	privateApis as componentsPrivateApis,
	Composite,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { isAppleOS } from '@wordpress/keycodes';
import { useContext, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ItemActions from '../../components/dataviews-item-actions';
import DataViewsSelectionCheckbox from '../../components/dataviews-selection-checkbox';
import DataViewsContext from '../../components/dataviews-context';
import {
	useHasAPossibleBulkAction,
	useSomeItemHasAPossibleBulkAction,
	useIsMultiselectPicker,
} from '../../components/dataviews-bulk-actions';
import type {
	Action,
	NormalizedField,
	ViewGrid as ViewGridType,
	ViewGridProps,
} from '../../types';
import type { SetSelection } from '../../private-types';
import { ItemClickWrapper } from '../utils/item-click-wrapper';
const { Badge } = unlock( componentsPrivateApis );

interface GridItemProps< Item > {
	view: ViewGridType;
	selection: string[];
	onChangeSelection: SetSelection;
	getItemId: ( item: Item ) => string;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isItemClickable: ( item: Item ) => boolean;
	item: Item;
	actions: Action< Item >[];
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	regularFields: NormalizedField< Item >[];
	badgeFields: NormalizedField< Item >[];
	hasBulkActions: boolean;
	config: {
		sizes: string;
	};
	picker?: boolean;
	posinset?: number;
	setsize?: number;
}

function GridItem< Item >( {
	view,
	selection,
	onChangeSelection,
	onClickItem,
	isItemClickable,
	renderItemLink,
	getItemId,
	item,
	actions,
	mediaField,
	titleField,
	descriptionField,
	regularFields,
	badgeFields,
	hasBulkActions,
	config,
	picker,
	posinset,
	setsize,
}: GridItemProps< Item > ) {
	const {
		showTitle = true,
		showMedia = true,
		showDescription = true,
		infiniteScrollEnabled,
	} = view;
	const hasBulkAction = useHasAPossibleBulkAction( actions, item );
	const id = getItemId( item );
	const instanceId = useInstanceId( GridItem );
	const isSelected = selection.includes( id );
	const renderedMediaField = mediaField?.render ? (
		<mediaField.render
			item={ item }
			field={ mediaField }
			config={ config }
		/>
	) : null;
	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;
	const shouldRenderMedia = showMedia && renderedMediaField;

	const isPicker = Boolean( picker );
	const getIsItemClickable = useCallback(
		() => ! isPicker && isItemClickable( item ),
		[ isPicker, item, isItemClickable ]
	);
	const isClickable = getIsItemClickable();
	const isMultiselectPicker = useIsMultiselectPicker( isPicker, actions );

	let mediaA11yProps;
	let titleA11yProps;
	if ( isClickable && onClickItem ) {
		if ( renderedTitleField ) {
			mediaA11yProps = {
				'aria-labelledby': `dataviews-view-grid__title-field-${ instanceId }`,
			};
			titleA11yProps = {
				id: `dataviews-view-grid__title-field-${ instanceId }`,
			};
		} else {
			mediaA11yProps = {
				'aria-label': __( 'Navigate to item' ),
			};
		}
	}

	let role = isPicker ? 'option' : undefined;
	if ( infiniteScrollEnabled ) {
		role = 'article';
	}

	return (
		<Composite.Item
			key={ id }
			render={ ( { children, ...props } ) => (
				<VStack spacing={ 0 } children={ children } { ...props } />
			) }
			role={ role }
			aria-posinset={ posinset }
			aria-setsize={ setsize }
			className={ clsx( 'dataviews-view-grid__card', {
				'is-selected': ( isPicker || hasBulkAction ) && isSelected,
			} ) }
			aria-selected={ isPicker && isSelected }
			onClick={ () => {
				if ( ! isPicker ) {
					return;
				}

				if ( isSelected ) {
					onChangeSelection(
						selection.filter( ( itemId ) => id !== itemId )
					);
				} else {
					const newSelection = isMultiselectPicker
						? [ ...selection, id ]
						: [ id ];
					onChangeSelection( newSelection );
				}
			} }
			onClickCapture={ ( event ) => {
				// Use the `onClick` handler when `isPicker` is set.
				// aria-kit will trigger `onClick` when the user presses
				// space or enter with an item actively selected.
				// It won't trigger `onClickCapture`.
				// `isPicker` selection handling is also slightly different,
				// it doesn't require a modifier key for multi-selection.
				if ( isPicker ) {
					return;
				}

				if ( isAppleOS() ? event.metaKey : event.ctrlKey ) {
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
			{ isClickable && shouldRenderMedia && (
				<ItemClickWrapper
					item={ item }
					isItemClickable={ getIsItemClickable }
					onClickItem={ onClickItem }
					renderItemLink={ renderItemLink }
					className="dataviews-view-grid__media"
					{ ...mediaA11yProps }
				>
					{ renderedMediaField }
				</ItemClickWrapper>
			) }
			{ ! isClickable && shouldRenderMedia && (
				<div
					className="dataviews-view-grid__media"
					{ ...mediaA11yProps }
				>
					{ renderedMediaField }
				</div>
			) }
			{ ( isPicker || hasBulkActions ) && shouldRenderMedia && (
				<DataViewsSelectionCheckbox
					item={ item }
					selection={ selection }
					onChangeSelection={ onChangeSelection }
					getItemId={ getItemId }
					titleField={ titleField }
					disabled={ ! isPicker && ! hasBulkAction }
					aria-hidden={ isPicker }
					tabIndex={ isPicker ? -1 : undefined }
				/>
			) }
			{ ! isPicker &&
				! showTitle &&
				shouldRenderMedia &&
				!! actions?.length && (
					<div className="dataviews-view-grid__media-actions">
						<ItemActions
							item={ item }
							actions={ actions }
							isCompact
						/>
					</div>
				) }
			{ showTitle && (
				<HStack
					justify="space-between"
					className="dataviews-view-grid__title-actions"
				>
					<ItemClickWrapper
						item={ item }
						isItemClickable={ isItemClickable }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
						className="dataviews-view-grid__title-field dataviews-title-field"
						{ ...titleA11yProps }
					>
						{ renderedTitleField }
					</ItemClickWrapper>
					{ ! isPicker && !! actions?.length && (
						<ItemActions
							item={ item }
							actions={ actions }
							isCompact
						/>
					) }
				</HStack>
			) }
			<VStack spacing={ 1 }>
				{ showDescription && descriptionField?.render && (
					<descriptionField.render
						item={ item }
						field={ descriptionField }
					/>
				) }
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
								<Badge
									key={ field.id }
									className="dataviews-view-grid__field-value"
								>
									<field.render
										item={ item }
										field={ field }
									/>
								</Badge>
							);
						} ) }
					</HStack>
				) }
				{ !! regularFields?.length && (
					<VStack
						className="dataviews-view-grid__fields"
						spacing={ 1 }
					>
						{ regularFields.map( ( field ) => {
							return (
								<Flex
									className="dataviews-view-grid__field"
									key={ field.id }
									gap={ 1 }
									justify="flex-start"
									expanded
									style={ { height: 'auto' } }
									direction="row"
								>
									<>
										<Tooltip text={ field.label }>
											<FlexItem className="dataviews-view-grid__field-name">
												{ field.header }
											</FlexItem>
										</Tooltip>
										<FlexItem
											className="dataviews-view-grid__field-value"
											style={ { maxHeight: 'none' } }
										>
											<field.render
												item={ item }
												field={ field }
											/>
										</FlexItem>
									</>
								</Flex>
							);
						} ) }
					</VStack>
				) }
			</VStack>
		</Composite.Item>
	);
}

function GridGroup< Item >( {
	groupName,
	groupField,
	isPicker,
	children,
}: {
	groupName: string;
	groupField: NormalizedField< Item >;
	isPicker?: boolean;
	children: ReactNode;
} ) {
	const headerId = useInstanceId(
		GridGroup,
		'dataviews-view-grid-group__header'
	);
	return (
		<VStack
			key={ groupName }
			spacing={ 2 }
			role={ isPicker ? 'group' : undefined }
			aria-labelledby={ headerId }
		>
			<h3 className="dataviews-view-grid-group__header" id={ headerId }>
				{ sprintf(
					// translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
					__( '%1$s: %2$s' ),
					groupField.label,
					groupName
				) }
			</h3>
			{ children }
		</VStack>
	);
}

function ViewGrid< Item >( {
	actions,
	data,
	fields,
	getItemId,
	isLoading,
	onChangeSelection,
	onClickItem,
	isItemClickable,
	renderItemLink,
	selection,
	view,
	className,
	empty,
	picker,
	label,
}: ViewGridProps< Item > ) {
	const { resizeObserverRef, paginationInfo } =
		useContext( DataViewsContext );
	const titleField = fields.find(
		( field ) => field.id === view?.titleField
	);
	const mediaField = fields.find(
		( field ) => field.id === view?.mediaField
	);
	const descriptionField = fields.find(
		( field ) => field.id === view?.descriptionField
	);
	const otherFields = view.fields ?? [];
	const { regularFields, badgeFields } = otherFields.reduce(
		(
			accumulator: Record< string, NormalizedField< Item >[] >,
			fieldId
		) => {
			const field = fields.find( ( f ) => f.id === fieldId );
			if ( ! field ) {
				return accumulator;
			}
			// If the field is a badge field, add it to the badgeFields array
			// otherwise add it to the rest visibleFields array.
			const key = view.layout?.badgeFields?.includes( fieldId )
				? 'badgeFields'
				: 'regularFields';
			accumulator[ key ].push( field );
			return accumulator;
		},
		{ regularFields: [], badgeFields: [] }
	);
	const hasData = !! data?.length;
	const hasBulkActions = useSomeItemHasAPossibleBulkAction( actions, data );
	const usedPreviewSize = view.layout?.previewSize;
	const isPicker = Boolean( picker );
	const isMultiselectPicker = useIsMultiselectPicker( isPicker, actions );

	/*
	 * This is the maximum width that an image can achieve in the grid. The reasoning is:
	 * The biggest min image width available is 430px (see /dataviews-layouts/grid/preview-size-picker.tsx).
	 * Because the grid is responsive, once there is room for another column, the images shrink to accommodate it.
	 * So each image will never grow past 2*430px plus a little more to account for the gaps.
	 */
	const size = '900px';

	const groupField = view.groupByField
		? fields.find( ( f ) => f.id === view.groupByField )
		: null;

	// Group data by groupByField if specified
	const dataByGroup = groupField
		? data.reduce( ( groups: Map< string, typeof data >, item ) => {
				const groupName = groupField.getValue( { item } );
				if ( ! groups.has( groupName ) ) {
					groups.set( groupName, [] );
				}
				groups.get( groupName )?.push( item );
				return groups;
		  }, new Map< string, typeof data >() )
		: null;

	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;
	let role = isInfiniteScroll ? 'feed' : undefined;
	if ( isPicker ) {
		role = 'listbox';
	}

	const currentPage = view?.page ?? 1;
	const perPage = view?.perPage ?? 0;
	const setSize =
		isPicker || isInfiniteScroll ? paginationInfo?.totalItems : undefined;

	return (
		<>
			{
				// Render multiple groups.
				hasData && groupField && dataByGroup && (
					<Composite
						composite={ isPicker }
						virtualFocus
						orientation="horizontal"
						role={ role }
						aria-multiselectable={
							isMultiselectPicker ?? undefined
						}
						className={ clsx( 'dataviews-view-grid', className, {
							'is-picker': isPicker,
						} ) }
						aria-label={ isPicker ? label : undefined }
						render={ ( { children, ...props } ) => (
							<VStack
								spacing={ 4 }
								children={ children }
								{ ...props }
							/>
						) }
					>
						{ Array.from( dataByGroup.entries() ).map(
							( [ groupName, groupItems ] ) => (
								<GridGroup
									key={ groupName }
									groupName={ groupName }
									groupField={ groupField }
									isPicker={ isPicker }
								>
									<div
										className="dataviews-view-grid__items"
										style={ {
											gridTemplateColumns:
												usedPreviewSize &&
												`repeat(auto-fill, minmax(${ usedPreviewSize }px, 1fr))`,
										} }
										aria-busy={ isLoading }
										ref={
											resizeObserverRef as React.RefObject< HTMLDivElement >
										}
									>
										{ groupItems.map( ( item ) => {
											const posInSet = isPicker
												? ( currentPage - 1 ) *
														perPage +
												  data.indexOf( item ) +
												  1
												: undefined;
											return (
												<GridItem
													key={ getItemId( item ) }
													view={ view }
													selection={ selection }
													onChangeSelection={
														onChangeSelection
													}
													onClickItem={ onClickItem }
													isItemClickable={
														isItemClickable
													}
													renderItemLink={
														renderItemLink
													}
													getItemId={ getItemId }
													item={ item }
													actions={ actions }
													mediaField={ mediaField }
													titleField={ titleField }
													descriptionField={
														descriptionField
													}
													regularFields={
														regularFields
													}
													badgeFields={ badgeFields }
													hasBulkActions={
														hasBulkActions
													}
													config={ {
														sizes: size,
													} }
													picker={ picker }
													posinset={ posInSet }
													setsize={ setSize }
												/>
											);
										} ) }
									</div>
								</GridGroup>
							)
						) }
					</Composite>
				)
			}

			{
				// Render a single grid with all data.
				hasData && ! dataByGroup && (
					<Composite
						composite={ isPicker }
						virtualFocus
						orientation="horizontal"
						role={ role }
						aria-multiselectable={
							isMultiselectPicker ?? undefined
						}
						aria-label={ isPicker ? label : undefined }
						className={ clsx(
							'dataviews-view-grid',
							'dataviews-view-grid__items',
							className,
							{
								'is-picker': isPicker,
							}
						) }
						style={ {
							gridTemplateColumns:
								usedPreviewSize &&
								`repeat(auto-fill, minmax(${ usedPreviewSize }px, 1fr))`,
						} }
						aria-busy={ isLoading }
						ref={
							resizeObserverRef as React.RefObject< HTMLDivElement >
						}
					>
						{ data.map( ( item, index ) => {
							let posinset = isInfiniteScroll
								? index + 1
								: undefined;

							if ( ! isInfiniteScroll && isPicker ) {
								// When infinite scroll isn't active, take pagination into account
								// when calculating the posinset.
								// Currently this is only happens when `isPicker` is true, as otherwise
								// the grid item doesn't use an aria-role that supports posinset.
								posinset = isPicker
									? ( currentPage - 1 ) * perPage + index + 1
									: undefined;
							}

							return (
								<GridItem
									key={ getItemId( item ) }
									view={ view }
									selection={ selection }
									onChangeSelection={ onChangeSelection }
									onClickItem={ onClickItem }
									isItemClickable={ isItemClickable }
									renderItemLink={ renderItemLink }
									getItemId={ getItemId }
									item={ item }
									actions={ actions }
									mediaField={ mediaField }
									titleField={ titleField }
									descriptionField={ descriptionField }
									regularFields={ regularFields }
									badgeFields={ badgeFields }
									hasBulkActions={ hasBulkActions }
									config={ {
										sizes: size,
									} }
									picker={ picker }
									posinset={ posinset }
									setsize={ setSize }
								/>
							);
						} ) }
					</Composite>
				)
			}
			{
				// Render empty state.
				! hasData && (
					<div
						className={ clsx( {
							'dataviews-loading': isLoading,
							'dataviews-no-results': ! isLoading,
						} ) }
					>
						<p>{ isLoading ? <Spinner /> : empty }</p>
					</div>
				)
			}
			{ hasData && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}

export default ViewGrid;
