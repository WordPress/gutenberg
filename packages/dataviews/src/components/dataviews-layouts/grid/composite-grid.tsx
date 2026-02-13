/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ComponentProps, ReactElement, HTMLAttributes } from 'react';

/**
 * WordPress dependencies
 */
import {
	Flex,
	FlexItem,
	Tooltip,
	Composite,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { isAppleOS } from '@wordpress/keycodes';
import { useContext, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import ItemActions from '../../dataviews-item-actions';
import DataViewsSelectionCheckbox from '../../dataviews-selection-checkbox';
import DataViewsContext from '../../dataviews-context';
import {
	useHasAPossibleBulkAction,
	useSomeItemHasAPossibleBulkAction,
} from '../../dataviews-bulk-actions';
import type {
	Action,
	NormalizedField,
	ViewGrid as ViewGridType,
} from '../../../types';
import type { SetSelection } from '../../../types/private';
import { ItemClickWrapper } from '../utils/item-click-wrapper';
const { Badge } = unlock( componentsPrivateApis );
import { useGridColumns } from './preview-size-picker';

function chunk< T >( array: T[], size: number ): T[][] {
	const chunks: T[][] = [];
	for ( let i = 0, j = array.length; i < j; i += size ) {
		chunks.push( array.slice( i, i + size ) );
	}
	return chunks;
}

interface GridItemProps< Item > extends HTMLAttributes< HTMLDivElement > {
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
}

const GridItem = forwardRef( function GridItem< Item >(
	{
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
		...props
	}: GridItemProps< Item >,
	ref: React.ForwardedRef< HTMLDivElement >
) {
	const { showTitle = true, showMedia = true, showDescription = true } = view;
	const hasBulkAction = useHasAPossibleBulkAction( actions, item );
	const id = getItemId( item );
	const instanceId = useInstanceId( GridItem );
	const isSelected = selection.includes( id );
	const mediaPlaceholder = (
		<span className="dataviews-view-grid__media-placeholder" />
	);
	const rendersMediaField = showMedia && mediaField?.render;
	const renderedMediaField = rendersMediaField ? (
		<mediaField.render
			item={ item }
			field={ mediaField }
			config={ config }
		/>
	) : (
		mediaPlaceholder
	);
	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;
	let mediaA11yProps;
	let titleA11yProps;
	if ( isItemClickable( item ) && onClickItem ) {
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
	return (
		<Stack
			direction="column"
			{ ...props }
			ref={ ref }
			className={ clsx(
				props.className,
				'dataviews-view-grid__row__gridcell',
				'dataviews-view-grid__card',
				{
					'is-selected': hasBulkAction && isSelected,
				}
			) }
			onClickCapture={ ( event ) => {
				props.onClickCapture?.( event );
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
			<ItemClickWrapper
				item={ item }
				isItemClickable={ isItemClickable }
				onClickItem={ onClickItem }
				renderItemLink={ renderItemLink }
				className={ clsx( 'dataviews-view-grid__media', {
					'dataviews-view-grid__media--placeholder':
						! rendersMediaField,
				} ) }
				{ ...mediaA11yProps }
			>
				{ renderedMediaField }
			</ItemClickWrapper>
			{ hasBulkActions && (
				<DataViewsSelectionCheckbox
					item={ item }
					selection={ selection }
					onChangeSelection={ onChangeSelection }
					getItemId={ getItemId }
					titleField={ titleField }
					disabled={ ! hasBulkAction }
				/>
			) }
			{ !! actions?.length && (
				<div className="dataviews-view-grid__media-actions">
					<ItemActions item={ item } actions={ actions } isCompact />
				</div>
			) }
			{ showTitle && (
				<div className="dataviews-view-grid__title">
					<ItemClickWrapper
						item={ item }
						isItemClickable={ isItemClickable }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
						className="dataviews-view-grid__title-field dataviews-title-field"
						{ ...titleA11yProps }
						title={
							titleField?.getValueFormatted( {
								item,
								field: titleField,
							} ) || undefined
						}
					>
						{ renderedTitleField }
					</ItemClickWrapper>
				</div>
			) }
			<Stack direction="column" gap="xs">
				{ showDescription && descriptionField?.render && (
					<descriptionField.render
						item={ item }
						field={ descriptionField }
					/>
				) }
				{ !! badgeFields?.length && (
					<Stack
						direction="row"
						className="dataviews-view-grid__badge-fields"
						gap="sm"
						wrap="wrap"
						align="top"
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
					</Stack>
				) }
				{ !! regularFields?.length && (
					<Stack
						direction="column"
						className="dataviews-view-grid__fields"
						gap="xs"
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
					</Stack>
				) }
			</Stack>
		</Stack>
	);
} ) as < Item >(
	props: GridItemProps< Item > & {
		ref?: React.ForwardedRef< HTMLDivElement >;
	}
) => React.ReactNode;

interface CompositeGridProps< Item > {
	data: Item[];
	isInfiniteScroll: boolean;
	className?: string;
	isLoading?: boolean;
	view: ViewGridType;
	fields: NormalizedField< Item >[];
	selection: string[];
	onChangeSelection: SetSelection;
	onClickItem?: ( item: Item ) => void;
	isItemClickable: ( item: Item ) => boolean;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	getItemId: ( item: Item ) => string;
	actions: Action< Item >[];
}

export default function CompositeGrid< Item >( {
	data,
	isInfiniteScroll,
	className,
	isLoading,
	view,
	fields,
	selection,
	onChangeSelection,
	onClickItem,
	isItemClickable,
	renderItemLink,
	getItemId,
	actions,
}: CompositeGridProps< Item > ) {
	const { paginationInfo, resizeObserverRef } =
		useContext( DataViewsContext );
	const gridColumns = useGridColumns();
	const hasBulkActions = useSomeItemHasAPossibleBulkAction( actions, data );
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

	/*
	 * This is the maximum width that an image can achieve in the grid. The reasoning is:
	 * The biggest min image width available is 430px (see /dataviews-layouts/grid/preview-size-picker.tsx).
	 * Because the grid is responsive, once there is room for another column, the images shrink to accommodate it.
	 * So each image will never grow past 2*430px plus a little more to account for the gaps.
	 */
	const size = '900px';
	const totalRows = Math.ceil( data.length / gridColumns );

	return (
		<Composite
			role={ isInfiniteScroll ? 'feed' : 'grid' }
			className={ clsx( 'dataviews-view-grid', className ) }
			focusWrap
			aria-busy={ isLoading }
			aria-rowcount={ isInfiniteScroll ? undefined : totalRows }
			ref={ resizeObserverRef }
		>
			{ chunk( data, gridColumns ).map( ( row, i ) => (
				<Composite.Row
					key={ i }
					render={
						<div
							role="row"
							aria-rowindex={ i + 1 }
							aria-label={ sprintf(
								/* translators: %d: The row number in the grid */
								__( 'Row %d' ),
								i + 1
							) }
							className="dataviews-view-grid__row"
							style={ {
								gridTemplateColumns: `repeat( ${ gridColumns }, minmax(0, 1fr) )`,
							} }
						/>
					}
				>
					{ row.map( ( item, indexInRow ) => {
						const index = i * gridColumns + indexInRow;
						return (
							<Composite.Item
								key={ getItemId( item ) }
								render={ ( props ) => (
									<GridItem
										{ ...props }
										role={
											isInfiniteScroll
												? 'article'
												: 'gridcell'
										}
										aria-setsize={
											isInfiniteScroll
												? paginationInfo.totalItems
												: undefined
										}
										aria-posinset={
											isInfiniteScroll
												? index + 1
												: undefined
										}
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
									/>
								) }
							/>
						);
					} ) }
				</Composite.Row>
			) ) }
		</Composite>
	);
}
