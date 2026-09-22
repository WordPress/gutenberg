import clsx from 'clsx';
import type { ComponentProps, CSSProperties, ReactElement } from 'react';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { Button, Spinner, Popover } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import {
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';
import {
	chevronDownSmall,
	chevronLeftSmall,
	chevronRightSmall,
} from '@wordpress/icons';
import DataViewsContext from '../../dataviews-context';
import DataViewsSelectionCheckbox from '../../dataviews-selection-checkbox';
import ItemActions from '../../dataviews-item-actions';
import { MEDIA_ASPECT_RATIOS, sortValues } from '../../../constants';
import {
	useSomeItemHasAPossibleBulkAction,
	useHasAPossibleBulkAction,
	hasAPossibleBulkAction,
	BulkSelectionCheckbox,
} from '../../dataviews-bulk-actions';
import type {
	Action,
	MediaAspectRatio,
	NormalizedField,
	ViewTable as ViewTableType,
	ViewTableProps,
} from '../../../types';
import type { SetSelection } from '../../../types/private';
import ColumnHeaderMenu from './column-header-menu';
import ColumnPrimary from './column-primary';
import getHierarchicalRows, {
	type HierarchicalRow,
} from './get-hierarchical-rows';
import { useScrollState } from './use-scroll-state';
import getDataByGroup from '../utils/get-data-by-group';
import getTableColumns from '../utils/get-table-columns';
import useSelectionProps from '../utils/use-selection-props';
import { PropertiesSection } from '../../dataviews-view-config/properties-section';
import { useDelayedLoading } from '../../../hooks/use-delayed-loading';

function getEffectiveAlign(
	explicitAlign: 'start' | 'center' | 'end' | undefined,
	fieldType: string | undefined
): 'start' | 'center' | 'end' | undefined {
	if ( explicitAlign ) {
		return explicitAlign;
	}
	if ( fieldType === 'integer' || fieldType === 'number' ) {
		return 'end';
	}
	return undefined;
}

function getRows< Item >(
	items: Item[],
	getItemId: ( item: Item ) => string,
	getItemLevel: ( ( item: Item ) => number ) | undefined,
	getItemParentId:
		( ( item: Item ) => string | number | null | undefined ) | undefined,
	showLevels: boolean | undefined
): HierarchicalRow< Item >[] {
	if ( showLevels && getItemParentId ) {
		return getHierarchicalRows( items, getItemId, getItemParentId );
	}

	return items.map( ( item, index ) => ( {
		item,
		id: getItemId( item ) || index.toString(),
		level: showLevels && getItemLevel ? getItemLevel( item ) : 0,
	} ) );
}

interface TreeRow< Item > extends HierarchicalRow< Item > {
	hasChildren: boolean;
	isExpanded: boolean;
}

function getTreeRows< Item >(
	rows: HierarchicalRow< Item >[],
	getItemHasChildren: ( item: Item ) => boolean | undefined,
	expandedItemIds: Set< string >
): { allRows: TreeRow< Item >[]; visibleRows: TreeRow< Item >[] } {
	const allRows = rows.map( ( row, index ) => ( {
		...row,
		hasChildren:
			rows[ index + 1 ]?.level > row.level ||
			getItemHasChildren( row.item ) !== false,
		isExpanded: expandedItemIds.has( row.id ),
	} ) );
	let collapsedLevel: number | undefined;
	const visibleRows = allRows.filter( ( row ) => {
		if ( collapsedLevel !== undefined ) {
			if ( row.level > collapsedLevel ) {
				return false;
			}
			collapsedLevel = undefined;
		}
		if ( row.hasChildren && ! row.isExpanded ) {
			collapsedLevel = row.level;
		}
		return true;
	} );

	return { allRows, visibleRows };
}

interface TableColumnFieldProps< Item > {
	fields: NormalizedField< Item >[];
	column: string;
	item: Item;
	align?: 'start' | 'center' | 'end';
}

interface TableRowProps< Item > {
	hasBulkActions: boolean;
	item: Item;
	level?: number;
	actions: Action< Item >[];
	fields: NormalizedField< Item >[];
	id: string;
	view: ViewTableType;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	mediaAspectRatio?: MediaAspectRatio;
	descriptionField?: NormalizedField< Item >;
	selection: string[];
	getItemId: ( item: Item ) => string;
	onChangeSelection: SetSelection;
	onMouseDown: ( event: React.MouseEvent ) => void;
	onClickCapture: ( event: React.MouseEvent ) => void;
	isItemClickable: ( item: Item ) => boolean;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isActionsColumnSticky?: boolean;
	posinset?: number;
	isTreeHierarchy?: boolean;
	hierarchyLevel?: number;
	hasChildren?: boolean;
	isExpanded?: boolean;
	onToggleExpanded?: ( id: string ) => void;
}

function TableColumnField< Item >( {
	item,
	fields,
	column,
	align,
}: TableColumnFieldProps< Item > ) {
	const field = fields.find( ( f ) => f.id === column );

	if ( ! field ) {
		return null;
	}

	const className = clsx( 'dataviews-view-table__cell-content-wrapper', {
		'dataviews-view-table__cell-align-end': align === 'end',
		'dataviews-view-table__cell-align-center': align === 'center',
	} );

	return (
		<div className={ className }>
			<field.render item={ item } field={ field } />
		</div>
	);
}

function TableRow< Item >( {
	hasBulkActions,
	item,
	level,
	actions,
	fields,
	id,
	view,
	titleField,
	mediaField,
	mediaAspectRatio,
	descriptionField,
	selection,
	getItemId,
	isItemClickable,
	onClickItem,
	renderItemLink,
	onChangeSelection,
	onMouseDown,
	onClickCapture,
	isActionsColumnSticky,
	posinset,
	isTreeHierarchy,
	hierarchyLevel = 0,
	hasChildren,
	isExpanded,
	onToggleExpanded,
}: TableRowProps< Item > ) {
	const { paginationInfo } = useContext( DataViewsContext );
	const hasPossibleBulkAction = useHasAPossibleBulkAction( actions, item );
	const isSelected = hasPossibleBulkAction && selection.includes( id );
	const {
		showTitle = true,
		showMedia = true,
		showDescription = true,
		infiniteScrollEnabled,
	} = view;
	const columns = getTableColumns( view, fields );
	const hasPrimaryColumn =
		( titleField && showTitle ) ||
		( mediaField && showMedia ) ||
		( descriptionField && showDescription );
	const itemTitle = titleField?.getValue?.( { item } );
	const itemLabel =
		typeof itemTitle === 'string' && itemTitle ? itemTitle : id;
	let hierarchyIcon = chevronRightSmall;
	if ( isExpanded ) {
		hierarchyIcon = chevronDownSmall;
	} else if ( isRTL() ) {
		hierarchyIcon = chevronLeftSmall;
	}

	return (
		<tr
			className={ clsx( 'dataviews-view-table__row', {
				'is-selected': hasPossibleBulkAction && isSelected,
				'has-bulk-actions': hasPossibleBulkAction,
			} ) }
			style={
				isTreeHierarchy
					? ( {
							'--wp-dataviews-table-hierarchy-level':
								hierarchyLevel,
						} as CSSProperties )
					: undefined
			}
			aria-setsize={
				infiniteScrollEnabled ? paginationInfo.totalItems : undefined
			}
			aria-posinset={ posinset }
			role={ infiniteScrollEnabled ? 'article' : undefined }
			onClickCapture={ onClickCapture }
			onMouseDown={ ( event ) => {
				// Firefox has a unique feature where ctrl/cmd + click selects a
				// table cell. This interferes with the bulk selection behavior,
				// so this code prevents it.
				const isMetaClick = isAppleOS() ? event.metaKey : event.ctrlKey;
				if (
					event.button === 0 &&
					isMetaClick &&
					window.navigator.userAgent
						.toLowerCase()
						.includes( 'firefox' )
				) {
					event.preventDefault();
				}
				onMouseDown( event );
			} }
		>
			{ isTreeHierarchy && (
				<td className="dataviews-view-table__hierarchy-column">
					<div className="dataviews-view-table__cell-content-wrapper dataviews-view-table__hierarchy-cell">
						{ hierarchyLevel > 0 && (
							<VisuallyHidden render={ <span /> }>
								{ sprintf(
									// translators: %d: The hierarchy level number.
									__( 'Hierarchy level %d' ),
									hierarchyLevel + 1
								) }
							</VisuallyHidden>
						) }
						{ hasChildren && (
							<Button
								className="dataviews-view-table__hierarchy-toggle"
								icon={ hierarchyIcon }
								label={
									isExpanded
										? sprintf(
												// translators: %s: The item title.
												__( 'Collapse %s' ),
												itemLabel
											)
										: sprintf(
												// translators: %s: The item title.
												__( 'Expand %s' ),
												itemLabel
											)
								}
								aria-expanded={ isExpanded }
								onClick={ () => onToggleExpanded?.( id ) }
								size="compact"
							/>
						) }
					</div>
				</td>
			) }
			{ hasBulkActions && (
				<td className="dataviews-view-table__checkbox-column">
					<div className="dataviews-view-table__cell-content-wrapper">
						<DataViewsSelectionCheckbox
							item={ item }
							selection={ selection }
							onChangeSelection={ onChangeSelection }
							getItemId={ getItemId }
							titleField={ titleField }
							disabled={ ! hasPossibleBulkAction }
						/>
					</div>
				</td>
			) }
			{ hasPrimaryColumn && (
				<td
					className={
						isTreeHierarchy
							? 'dataviews-view-table__hierarchy-content-column'
							: undefined
					}
				>
					<ColumnPrimary
						item={ item }
						level={ level }
						titleField={ showTitle ? titleField : undefined }
						mediaField={ showMedia ? mediaField : undefined }
						mediaAspectRatio={ mediaAspectRatio }
						descriptionField={
							showDescription ? descriptionField : undefined
						}
						isItemClickable={ isItemClickable }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
					/>
				</td>
			) }
			{ columns.map( ( column: string, index: number ) => {
				// Explicit picks the supported styles.
				const { width, maxWidth, minWidth, align } =
					view.layout?.styles?.[ column ] ?? {};
				const field = fields.find( ( f ) => f.id === column );
				const effectiveAlign = getEffectiveAlign( align, field?.type );

				return (
					<td
						key={ column }
						className={
							isTreeHierarchy && ! hasPrimaryColumn && index === 0
								? 'dataviews-view-table__hierarchy-content-column'
								: undefined
						}
						style={ {
							width,
							maxWidth,
							minWidth,
						} }
					>
						<TableColumnField
							fields={ fields }
							item={ item }
							column={ column }
							align={ effectiveAlign }
						/>
					</td>
				);
			} ) }
			{ !! actions?.length && (
				// Disable reason: we are not making the element interactive,
				// but preventing any click events from bubbling up to the
				// table row. This allows us to add a click handler to the row
				// itself (to toggle row selection) without erroneously
				// intercepting click events from ItemActions.

				<td
					className={ clsx( 'dataviews-view-table__actions-column', {
						'dataviews-view-table__actions-column--sticky': true,
						'dataviews-view-table__actions-column--stuck':
							isActionsColumnSticky,
					} ) }
					onClick={ ( e ) => e.stopPropagation() }
				>
					<ItemActions item={ item } actions={ actions } />
				</td>
			) }
		</tr>
	);
}

function ViewTable< Item >( {
	actions,
	data,
	fields,
	getItemId,
	getItemLevel,
	getItemParentId,
	getItemHasChildren,
	expandedItemIds,
	onChangeExpandedItemIds,
	isLoading = false,
	onChangeView,
	onChangeSelection,
	selection,
	setOpenedFilter,
	onClickItem,
	isItemClickable,
	renderItemLink,
	view,
	className,
	empty,
}: ViewTableProps< Item > ) {
	const { containerRef } = useContext( DataViewsContext );
	const isDelayedLoading = useDelayedLoading( isLoading );
	const groupField = view.groupBy?.field
		? fields.find( ( f ) => f.id === view.groupBy?.field )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;
	const rows = dataByGroup
		? []
		: getRows(
				data,
				getItemId,
				getItemLevel,
				getItemParentId,
				view.showLevels
			);
	const isTreeHierarchy = !! (
		! dataByGroup &&
		view.showLevels &&
		getItemParentId &&
		getItemHasChildren &&
		expandedItemIds &&
		onChangeExpandedItemIds
	);
	const expandedItemIdSet = new Set( expandedItemIds );
	const treeRows = isTreeHierarchy
		? getTreeRows( rows, getItemHasChildren, expandedItemIdSet )
		: undefined;
	const renderedRows = treeRows?.visibleRows ?? rows;
	const expandableItemIds =
		treeRows?.allRows
			.filter( ( row ) => row.hasChildren )
			.map( ( row ) => row.id ) ?? [];
	const expandableItemIdSet = new Set( expandableItemIds );
	const allItemsExpanded =
		expandableItemIds.length > 0 &&
		expandableItemIds.every( ( id ) => expandedItemIdSet.has( id ) );
	const onToggleExpanded = ( id: string ) => {
		onChangeExpandedItemIds?.(
			expandedItemIdSet.has( id )
				? ( expandedItemIds ?? [] ).filter(
						( itemId ) => itemId !== id
					)
				: [ ...( expandedItemIds ?? [] ), id ]
		);
	};
	// Selection ranges follow the rendered hierarchy and group order.
	const orderedData = dataByGroup
		? Array.from( dataByGroup.values() ).flat()
		: renderedRows.map( ( row ) => row.item );
	const { getSelectionProps } = useSelectionProps( {
		data: orderedData,
		getItemId,
		isItemSelectable: ( item ) => hasAPossibleBulkAction( actions, item ),
		selection,
		onChangeSelection,
		selectionMode: 'multi',
		shouldSelectOnClick: false,
	} );
	const headerMenuRefs = useRef<
		Map< string, { node: HTMLButtonElement; fallback: string } >
	>( new Map() );
	const headerMenuToFocusRef = useRef< HTMLButtonElement >( undefined );
	const [ nextHeaderMenuToFocus, setNextHeaderMenuToFocus ] =
		useState< HTMLButtonElement >();
	const [ contextMenuAnchor, setContextMenuAnchor ] = useState< {
		getBoundingClientRect: () => DOMRect;
	} | null >( null );

	useEffect( () => {
		if ( headerMenuToFocusRef.current ) {
			headerMenuToFocusRef.current.focus();
			headerMenuToFocusRef.current = undefined;
		}
	} );

	const tableNoticeId = useId();

	const { isHorizontalScrollEnd, isVerticallyScrolled } = useScrollState( {
		scrollContainerRef: containerRef,
		enabledHorizontal: !! actions?.length,
	} );

	const hasBulkActions = useSomeItemHasAPossibleBulkAction( actions, data );

	if ( nextHeaderMenuToFocus ) {
		// If we need to force focus, we short-circuit rendering here
		// to prevent any additional work while we handle that.
		// Clearing out the focus directive is necessary to make sure
		// future renders don't cause unexpected focus jumps.
		headerMenuToFocusRef.current = nextHeaderMenuToFocus;
		setNextHeaderMenuToFocus( undefined );
		return;
	}

	const onHide = ( field: NormalizedField< Item > ) => {
		const hidden = headerMenuRefs.current.get( field.id );
		const fallback = hidden
			? headerMenuRefs.current.get( hidden.fallback )
			: undefined;
		setNextHeaderMenuToFocus( fallback?.node );
	};

	const handleHeaderContextMenu = ( event: React.MouseEvent ) => {
		event.preventDefault();
		event.stopPropagation();
		const virtualAnchor = {
			getBoundingClientRect: () => ( {
				x: event.clientX,
				y: event.clientY,
				top: event.clientY,
				left: event.clientX,
				right: event.clientX,
				bottom: event.clientY,
				width: 0,
				height: 0,
				toJSON: () => ( {} ),
			} ),
		};
		window.requestAnimationFrame( () => {
			setContextMenuAnchor( virtualAnchor );
		} );
	};

	const hasData = !! data?.length;

	const titleField = fields.find( ( field ) => field.id === view.titleField );
	const mediaField = fields.find( ( field ) => field.id === view.mediaField );
	const descriptionField = fields.find(
		( field ) => field.id === view.descriptionField
	);

	const { showTitle = true, showMedia = true, showDescription = true } = view;
	const hasPrimaryColumn =
		( titleField && showTitle ) ||
		( mediaField && showMedia ) ||
		( descriptionField && showDescription );
	const columns = getTableColumns( view, fields );
	const headerMenuRef =
		( column: string, index: number ) => ( node: HTMLButtonElement ) => {
			if ( node ) {
				headerMenuRefs.current.set( column, {
					node,
					fallback: columns[ index > 0 ? index - 1 : 1 ],
				} );
			} else {
				headerMenuRefs.current.delete( column );
			}
		};
	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;
	const isRtl = isRTL();
	let hierarchyHeaderIcon = isRtl ? chevronLeftSmall : chevronRightSmall;
	if ( allItemsExpanded ) {
		hierarchyHeaderIcon = chevronDownSmall;
	}
	// Consumer-configured aspect ratio for the primary column's media preview,
	// validated against the presets (like `density`) so arbitrary values are
	// ignored, and surfaced to CSS as a custom property the media stylesheet
	// reads. The property is always set (with the square default), so an
	// identically-named variable set by a consumer on an ancestor can't leak
	// into the previews when the view doesn't configure a ratio. The sizing
	// itself only engages behind the `has-media-aspect-ratio` modifier below.
	const mediaAspectRatio =
		view.layout?.aspectRatio &&
		MEDIA_ASPECT_RATIOS.includes( view.layout.aspectRatio )
			? view.layout.aspectRatio
			: undefined;
	const tableStyle = {
		'--wp-dataviews-media-aspect-ratio': mediaAspectRatio ?? '1/1',
	} as CSSProperties;
	if ( ! hasData ) {
		return (
			<div
				className={ clsx( 'dataviews-no-results', {
					'is-refreshing': isDelayedLoading,
				} ) }
				id={ tableNoticeId }
			>
				{ empty }
			</div>
		);
	}

	return (
		<>
			<table
				className={ clsx( 'dataviews-view-table', className, {
					[ `has-${ view.layout?.density }-density` ]:
						view.layout?.density &&
						[ 'compact', 'comfortable' ].includes(
							view.layout.density
						),
					'has-bulk-actions': hasBulkActions,
					'is-refreshing': ! isInfiniteScroll && isDelayedLoading,
					'has-media-aspect-ratio': !! mediaAspectRatio,
				} ) }
				style={ tableStyle }
				aria-busy={ isLoading }
				aria-describedby={ tableNoticeId }
				role={ isInfiniteScroll ? 'feed' : undefined }
				// @ts-expect-error `inert` is not declared in React 18's HTML attribute types.
				inert={ ! isInfiniteScroll && isLoading ? 'true' : undefined }
			>
				<colgroup>
					{ isTreeHierarchy && (
						<col className="dataviews-view-table__col-hierarchy" />
					) }
					{ hasBulkActions && (
						<col className="dataviews-view-table__col-checkbox" />
					) }
					{ hasPrimaryColumn && (
						<col className="dataviews-view-table__col-first-data" />
					) }
					{ columns.map( ( column, index ) => (
						<col
							key={ `col-${ column }` }
							className={ clsx(
								`dataviews-view-table__col-${ column }`,
								{
									'dataviews-view-table__col-expand':
										! hasPrimaryColumn &&
										index === columns.length - 1,
								}
							) }
						/>
					) ) }
					{ !! actions?.length && (
						<col className="dataviews-view-table__col-actions" />
					) }
				</colgroup>
				{ contextMenuAnchor && (
					<Popover
						anchor={ contextMenuAnchor }
						onClose={ () => setContextMenuAnchor( null ) }
						placement="bottom-start"
					>
						<PropertiesSection showLabel={ false } />
					</Popover>
				) }
				<thead
					className={ clsx( {
						'dataviews-view-table__thead--stuck':
							isVerticallyScrolled,
					} ) }
					onContextMenu={ handleHeaderContextMenu }
				>
					<tr className="dataviews-view-table__row">
						{ isTreeHierarchy && (
							<th
								className="dataviews-view-table__hierarchy-column"
								scope="col"
							>
								{ expandableItemIds.length > 0 && (
									<Button
										className="dataviews-view-table__hierarchy-toggle"
										icon={ hierarchyHeaderIcon }
										label={
											allItemsExpanded
												? __( 'Collapse all' )
												: __( 'Expand all' )
										}
										onClick={ () =>
											onChangeExpandedItemIds?.(
												allItemsExpanded
													? (
															expandedItemIds ??
															[]
														).filter(
															( id ) =>
																! expandableItemIdSet.has(
																	id
																)
														)
													: [
															...new Set( [
																...( expandedItemIds ??
																	[] ),
																...expandableItemIds,
															] ),
														]
											)
										}
										size="compact"
									/>
								) }
							</th>
						) }
						{ hasBulkActions && (
							<th
								className="dataviews-view-table__checkbox-column"
								scope="col"
								onContextMenu={ handleHeaderContextMenu }
							>
								<BulkSelectionCheckbox
									selection={ selection }
									onChangeSelection={ onChangeSelection }
									data={ data }
									actions={ actions }
									getItemId={ getItemId }
								/>
							</th>
						) }
						{ hasPrimaryColumn && (
							<th scope="col">
								{ titleField && (
									<ColumnHeaderMenu
										ref={ headerMenuRef(
											titleField.id,
											0
										) }
										fieldId={ titleField.id }
										view={ view }
										fields={ fields }
										onChangeView={ onChangeView }
										onHide={ onHide }
										setOpenedFilter={ setOpenedFilter }
										canMove={ false }
										canInsertLeft={
											isRtl
												? ( view.layout?.enableMoving ??
													true )
												: false
										}
										canInsertRight={
											isRtl
												? false
												: ( view.layout?.enableMoving ??
													true )
										}
									/>
								) }
							</th>
						) }
						{ columns.map( ( column, index ) => {
							// Explicit picks the supported styles.
							const { width, maxWidth, minWidth, align } =
								view.layout?.styles?.[ column ] ?? {};
							const field = fields.find(
								( f ) => f.id === column
							);
							const effectiveAlign = getEffectiveAlign(
								align,
								field?.type
							);
							const canInsertOrMove =
								view.layout?.enableMoving ?? true;
							return (
								<th
									key={ column }
									style={ {
										width,
										maxWidth,
										minWidth,
										textAlign: effectiveAlign,
									} }
									aria-sort={
										view.sort?.direction &&
										view.sort?.field === column
											? sortValues[ view.sort.direction ]
											: undefined
									}
									scope="col"
								>
									<ColumnHeaderMenu
										ref={ headerMenuRef( column, index ) }
										fieldId={ column }
										view={ view }
										fields={ fields }
										onChangeView={ onChangeView }
										onHide={ onHide }
										setOpenedFilter={ setOpenedFilter }
										canMove={ canInsertOrMove }
										canInsertLeft={ canInsertOrMove }
										canInsertRight={ canInsertOrMove }
									/>
								</th>
							);
						} ) }
						{ !! actions?.length && (
							<th
								className={ clsx(
									'dataviews-view-table__actions-column',
									{
										'dataviews-view-table__actions-column--sticky': true,
										'dataviews-view-table__actions-column--stuck':
											! isHorizontalScrollEnd,
									}
								) }
							>
								<span className="dataviews-view-table-header">
									{ __( 'Actions' ) }
								</span>
							</th>
						) }
					</tr>
				</thead>
				{ /* Render grouped data if groupBy is specified */ }
				{ hasData && groupField && dataByGroup ? (
					Array.from( dataByGroup.entries() ).map(
						( [ groupName, groupItems ] ) => (
							<tbody key={ `group-${ groupName }` }>
								<tr className="dataviews-view-table__group-header-row">
									<td
										colSpan={
											columns.length +
											( hasPrimaryColumn ? 1 : 0 ) +
											( hasBulkActions ? 1 : 0 ) +
											( actions?.length ? 1 : 0 )
										}
										className="dataviews-view-table__group-header-cell"
									>
										{ view.groupBy?.showLabel === false
											? groupName
											: sprintf(
													// translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
													__( '%1$s: %2$s' ),
													groupField.label,
													groupName
												) }
									</td>
								</tr>
								{ groupItems.map( ( item, index ) => {
									const id =
										getItemId( item ) || index.toString();
									return (
										<TableRow
											key={ getItemId( item ) }
											item={ item }
											level={
												view.showLevels &&
												typeof getItemLevel ===
													'function'
													? getItemLevel( item )
													: undefined
											}
											hasBulkActions={ hasBulkActions }
											actions={ actions }
											fields={ fields }
											id={ id }
											view={ view }
											titleField={ titleField }
											mediaField={ mediaField }
											mediaAspectRatio={
												mediaAspectRatio
											}
											descriptionField={
												descriptionField
											}
											selection={ selection }
											getItemId={ getItemId }
											onChangeSelection={
												onChangeSelection
											}
											{ ...getSelectionProps( id ) }
											onClickItem={ onClickItem }
											renderItemLink={ renderItemLink }
											isItemClickable={ isItemClickable }
											isActionsColumnSticky={
												! isHorizontalScrollEnd
											}
										/>
									);
								} ) }
							</tbody>
						)
					)
				) : (
					<tbody>
						{ hasData &&
							renderedRows.map( ( row, index ) => {
								const { id, item, level } = row;
								const treeRow = isTreeHierarchy
									? ( row as TreeRow< Item > )
									: undefined;
								return (
									<TableRow
										key={ id }
										item={ item }
										level={
											isTreeHierarchy ? undefined : level
										}
										hasBulkActions={ hasBulkActions }
										actions={ actions }
										fields={ fields }
										id={ id }
										view={ view }
										titleField={ titleField }
										mediaField={ mediaField }
										mediaAspectRatio={ mediaAspectRatio }
										descriptionField={ descriptionField }
										selection={ selection }
										getItemId={ getItemId }
										onChangeSelection={ onChangeSelection }
										{ ...getSelectionProps( id ) }
										onClickItem={ onClickItem }
										renderItemLink={ renderItemLink }
										isItemClickable={ isItemClickable }
										isActionsColumnSticky={
											! isHorizontalScrollEnd
										}
										isTreeHierarchy={ isTreeHierarchy }
										hierarchyLevel={ level }
										hasChildren={ treeRow?.hasChildren }
										isExpanded={ treeRow?.isExpanded }
										onToggleExpanded={ onToggleExpanded }
										posinset={
											isInfiniteScroll
												? index + 1
												: undefined
										}
									/>
								);
							} ) }
					</tbody>
				) }
			</table>
			{ isInfiniteScroll && isLoading && (
				<div className="dataviews-loading" id={ tableNoticeId }>
					<p className="dataviews-loading-more">
						<Spinner />
					</p>
				</div>
			) }
		</>
	);
}

export default ViewTable;
