/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { Button, Spinner, Popover } from '@wordpress/components';
import {
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';
import {
	chevronDownSmall,
	chevronLeftSmall,
	chevronRightSmall,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DataViewsContext from '../../dataviews-context';
import DataViewsSelectionCheckbox from '../../dataviews-selection-checkbox';
import ItemActions from '../../dataviews-item-actions';
import { sortValues } from '../../../constants';
import {
	useSomeItemHasAPossibleBulkAction,
	useHasAPossibleBulkAction,
	BulkSelectionCheckbox,
} from '../../dataviews-bulk-actions';
import type {
	Action,
	NormalizedField,
	ViewTable as ViewTableType,
	ViewTableProps,
} from '../../../types';
import type { SetSelection } from '../../../types/private';
import ColumnHeaderMenu from './column-header-menu';
import ColumnPrimary from './column-primary';
import { useScrollState } from './use-scroll-state';
import { getTreeRows, getVisibleTreeRows } from './tree-rows';
import getDataByGroup from '../utils/get-data-by-group';
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

interface TableRenderRow< Item > {
	item: Item;
	id: string;
	level?: number;
	hierarchyLevel?: number;
	childCount?: number;
	isExpanded?: boolean;
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
	descriptionField?: NormalizedField< Item >;
	selection: string[];
	getItemId: ( item: Item ) => string;
	onChangeSelection: SetSelection;
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
	childCount?: number;
	showHierarchyBadge?: boolean;
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
	descriptionField,
	selection,
	getItemId,
	isItemClickable,
	onClickItem,
	renderItemLink,
	onChangeSelection,
	isActionsColumnSticky,
	posinset,
	isTreeHierarchy,
	hierarchyLevel = 0,
	childCount = 0,
	showHierarchyBadge,
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
	// Will be set to true if `onTouchStart` fires. This happens before
	// `onClick` and can be used to exclude touchscreen devices from certain
	// behaviours.
	const isTouchDeviceRef = useRef( false );
	const columns = view.fields ?? [];
	const hasPrimaryColumn =
		( titleField && showTitle ) ||
		( mediaField && showMedia ) ||
		( descriptionField && showDescription );
	const itemTitle = titleField?.getValue?.( { item } );
	const itemLabel =
		typeof itemTitle === 'string' && itemTitle ? itemTitle : id;
	const hasChildren = childCount > 0;
	const hierarchyToggleLabel = isExpanded
		? sprintf(
				// translators: %s: The item title.
				__( 'Collapse %s' ),
				itemLabel
		  )
		: sprintf(
				// translators: %s: The item title.
				__( 'Expand %s' ),
				itemLabel
		  );
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
					  } as React.CSSProperties )
					: undefined
			}
			onTouchStart={ () => {
				isTouchDeviceRef.current = true;
			} }
			aria-setsize={
				infiniteScrollEnabled ? paginationInfo.totalItems : undefined
			}
			aria-posinset={ posinset }
			role={ infiniteScrollEnabled ? 'article' : undefined }
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
					event?.preventDefault();
				}
			} }
			onClick={ ( event ) => {
				if ( ! hasPossibleBulkAction ) {
					return;
				}

				// Only handle Ctrl/Cmd+Click for multi-selection
				const isModifierKeyPressed = isAppleOS()
					? event.metaKey
					: event.ctrlKey;

				if (
					isModifierKeyPressed &&
					! isTouchDeviceRef.current &&
					document.getSelection()?.type !== 'Range'
				) {
					// Handle non-consecutive selection with Ctrl/Cmd+Click
					onChangeSelection(
						selection.includes( id )
							? selection.filter( ( itemId ) => id !== itemId )
							: [ ...selection, id ]
					);
				}
			} }
		>
			{ isTreeHierarchy && (
				<td className="dataviews-view-table__hierarchy-column">
					<div className="dataviews-view-table__cell-content-wrapper dataviews-view-table__hierarchy-cell">
						{ hasChildren ? (
							<Button
								className="dataviews-view-table__hierarchy-toggle"
								icon={ hierarchyIcon }
								label={ hierarchyToggleLabel }
								aria-expanded={ isExpanded }
								onClick={ () => {
									onToggleExpanded?.( id );
								} }
								size="compact"
							/>
						) : (
							<span
								className="dataviews-view-table__hierarchy-toggle-placeholder"
								aria-hidden="true"
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
				<td>
					<ColumnPrimary
						item={ item }
						level={ level }
						childCount={ childCount }
						showHierarchyBadge={ showHierarchyBadge }
						titleField={ showTitle ? titleField : undefined }
						mediaField={ showMedia ? mediaField : undefined }
						descriptionField={
							showDescription ? descriptionField : undefined
						}
						isItemClickable={ isItemClickable }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
					/>
				</td>
			) }
			{ columns.map( ( column: string ) => {
				// Explicit picks the supported styles.
				const { width, maxWidth, minWidth, align } =
					view.layout?.styles?.[ column ] ?? {};
				const field = fields.find( ( f ) => f.id === column );
				const effectiveAlign = getEffectiveAlign( align, field?.type );

				return (
					<td
						key={ column }
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
	const headerMenuRefs = useRef<
		Map< string, { node: HTMLButtonElement; fallback: string } >
	>( new Map() );
	const headerMenuToFocusRef = useRef< HTMLButtonElement >( undefined );
	const [ nextHeaderMenuToFocus, setNextHeaderMenuToFocus ] =
		useState< HTMLButtonElement >();
	const [ contextMenuAnchor, setContextMenuAnchor ] = useState< {
		getBoundingClientRect: () => DOMRect;
	} | null >( null );

	const isTreeHierarchy = !! (
		view.showLevels &&
		typeof getItemParentId === 'function' &&
		view.layout?.hierarchyStyle === 'tree'
	);
	const isTextHierarchy = !! (
		view.showLevels &&
		( typeof getItemParentId === 'function' ||
			typeof getItemLevel === 'function' ) &&
		view.layout?.hierarchyStyle !== 'tree'
	);
	const treeRows = useMemo( () => {
		if ( ! ( isTreeHierarchy || isTextHierarchy ) || ! getItemParentId ) {
			return [];
		}
		return getTreeRows( data, getItemId, getItemParentId );
	}, [ data, getItemId, getItemParentId, isTextHierarchy, isTreeHierarchy ] );

	const [ expandedItemIds, setExpandedItemIds ] = useState< Set< string > >(
		() => {
			if ( ! isTreeHierarchy ) {
				return new Set();
			}

			return new Set(
				view.layout?.expandChildren
					? treeRows
							.filter( ( treeRow ) => treeRow.childCount )
							.map( ( treeRow ) => treeRow.id )
					: []
			);
		}
	);
	const manuallyCollapsedItemIdsRef = useRef< Set< string > >( new Set() );

	useEffect( () => {
		if ( ! isTreeHierarchy || ! view.layout?.expandChildren ) {
			return;
		}

		setExpandedItemIds( ( previousExpandedItemIds ) => {
			const nextExpandedItemIds = new Set( previousExpandedItemIds );
			let hasChanges = false;

			for ( const treeRow of treeRows ) {
				if (
					treeRow.childCount &&
					! nextExpandedItemIds.has( treeRow.id ) &&
					! manuallyCollapsedItemIdsRef.current.has( treeRow.id )
				) {
					nextExpandedItemIds.add( treeRow.id );
					hasChanges = true;
				}
			}

			return hasChanges ? nextExpandedItemIds : previousExpandedItemIds;
		} );
	}, [ treeRows, isTreeHierarchy, view.layout?.expandChildren ] );

	const showHierarchyBadge =
		isTreeHierarchy && view.layout?.showHierarchyBadge !== false;

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

	const groupField = view.groupBy?.field
		? fields.find( ( f ) => f.id === view.groupBy?.field )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;
	const { showTitle = true, showMedia = true, showDescription = true } = view;
	const hasPrimaryColumn =
		( titleField && showTitle ) ||
		( mediaField && showMedia ) ||
		( descriptionField && showDescription );
	const columns = view.fields ?? [];
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
	const onToggleExpanded = ( itemId: string ) => {
		setExpandedItemIds( ( previousExpandedItemIds ) => {
			const nextExpandedItemIds = new Set( previousExpandedItemIds );
			if ( nextExpandedItemIds.has( itemId ) ) {
				nextExpandedItemIds.delete( itemId );
				if ( view.layout?.expandChildren ) {
					manuallyCollapsedItemIdsRef.current.add( itemId );
				}
			} else {
				nextExpandedItemIds.add( itemId );
				manuallyCollapsedItemIdsRef.current.delete( itemId );
			}
			return nextExpandedItemIds;
		} );
	};
	const getTextLevel = ( item: Item ) => {
		if ( getItemParentId ) {
			return undefined;
		}

		const level = getItemLevel?.( item );
		return typeof level === 'number' && Number.isFinite( level )
			? Math.max( 0, level )
			: undefined;
	};
	const getRowsToRender = ( items: Item[] ): TableRenderRow< Item >[] => {
		if ( ! ( isTreeHierarchy || isTextHierarchy ) || ! getItemParentId ) {
			return items.map( ( item, index ) => ( {
				item,
				id: getItemId( item ) || index.toString(),
				level: isTextHierarchy ? getTextLevel( item ) : undefined,
			} ) );
		}

		const rows = getTreeRows( items, getItemId, getItemParentId );

		if ( isTextHierarchy ) {
			return rows.map( ( treeRow ) => ( {
				...treeRow,
				level: treeRow.depth,
			} ) );
		}

		return getVisibleTreeRows( rows, expandedItemIds ).map(
			( treeRow ) => ( {
				...treeRow,
				level: undefined,
				hierarchyLevel: treeRow.depth,
				isExpanded: expandedItemIds.has( treeRow.id ),
			} )
		);
	};
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
				} ) }
				aria-busy={ isLoading }
				aria-describedby={ tableNoticeId }
				role={ isInfiniteScroll ? 'feed' : undefined }
				// @ts-ignore Reason: inert is a recent HTML attribute
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
								onContextMenu={ handleHeaderContextMenu }
							/>
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
												? view.layout?.enableMoving ??
												  true
												: false
										}
										canInsertRight={
											isRtl
												? false
												: view.layout?.enableMoving ??
												  true
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
										'dataviews-view-table__actions-column--sticky':
											true,
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
											( isTreeHierarchy ? 1 : 0 ) +
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
								{ getRowsToRender( groupItems ).map(
									( row ) => (
										<TableRow
											key={ row.id }
											item={ row.item }
											level={ row.level }
											hasBulkActions={ hasBulkActions }
											actions={ actions }
											fields={ fields }
											id={ row.id }
											view={ view }
											titleField={ titleField }
											mediaField={ mediaField }
											descriptionField={
												descriptionField
											}
											selection={ selection }
											getItemId={ getItemId }
											onChangeSelection={
												onChangeSelection
											}
											onClickItem={ onClickItem }
											renderItemLink={ renderItemLink }
											isItemClickable={ isItemClickable }
											isActionsColumnSticky={
												! isHorizontalScrollEnd
											}
											isTreeHierarchy={ isTreeHierarchy }
											hierarchyLevel={
												row.hierarchyLevel
											}
											childCount={ row.childCount }
											showHierarchyBadge={
												showHierarchyBadge
											}
											isExpanded={ row.isExpanded }
											onToggleExpanded={
												onToggleExpanded
											}
										/>
									)
								) }
							</tbody>
						)
					)
				) : (
					<tbody>
						{ hasData &&
							getRowsToRender( data ).map( ( row, index ) => (
								<TableRow
									key={ row.id }
									item={ row.item }
									level={ row.level }
									hasBulkActions={ hasBulkActions }
									actions={ actions }
									fields={ fields }
									id={ row.id || index.toString() }
									view={ view }
									titleField={ titleField }
									mediaField={ mediaField }
									descriptionField={ descriptionField }
									selection={ selection }
									getItemId={ getItemId }
									onChangeSelection={ onChangeSelection }
									onClickItem={ onClickItem }
									renderItemLink={ renderItemLink }
									isItemClickable={ isItemClickable }
									isActionsColumnSticky={
										! isHorizontalScrollEnd
									}
									posinset={
										isInfiniteScroll ? index + 1 : undefined
									}
									isTreeHierarchy={ isTreeHierarchy }
									hierarchyLevel={ row.hierarchyLevel }
									childCount={ row.childCount }
									showHierarchyBadge={ showHierarchyBadge }
									isExpanded={ row.isExpanded }
									onToggleExpanded={ onToggleExpanded }
								/>
							) ) }
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
