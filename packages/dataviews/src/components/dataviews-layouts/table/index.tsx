import clsx from 'clsx';
import type { ComponentProps, CSSProperties, ReactElement } from 'react';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	Button,
	Spinner as WCSpinner,
	Popover as WCPopover,
} from '@wordpress/components';
import {
	chevronDownSmall,
	chevronLeftSmall,
	chevronRightSmall,
} from '@wordpress/icons';
import { VisuallyHidden } from '@wordpress/ui';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';
import {
	useContext,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';
import { inertValue } from '@wordpress/react-inert-value';
import DataViewsContext from '../../dataviews-context';
import DataViewsSelectionCheckbox from '../../dataviews-selection-checkbox';
import ItemActions from '../../dataviews-item-actions';
import { MEDIA_ASPECT_RATIOS, sortValues } from '../../../constants';
import {
	useSomeItemHasAPossibleBulkAction,
	useHasAPossibleBulkAction,
	hasAPossibleBulkAction,
	BulkSelectionCheckbox,
	BulkActionToolbar,
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
import getTreeRows, { type TreeRow } from './get-tree-rows';
import { useScrollState } from './use-scroll-state';
import useBulkActionsFocus from '../utils/use-bulk-actions-focus';
import getDataByGroup from '../utils/get-data-by-group';
import getTableColumns from '../utils/get-table-columns';
import useSelectionProps from '../utils/use-selection-props';
import { PropertiesSection } from '../../dataviews-view-config/properties-section';
import { useDelayedLoading } from '../../../hooks/use-delayed-loading';

// The name of a row in labels: its title, else its id.
function getItemLabel< Item >(
	item: Item,
	id: string,
	titleField?: NormalizedField< Item >
) {
	return titleField?.getValue?.( { item } ) || id;
}

function getToggleIcon( isExpanded?: boolean ) {
	if ( isExpanded ) {
		return chevronDownSmall;
	}
	return isRTL() ? chevronLeftSmall : chevronRightSmall;
}

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
	posinset?: number;
	treeRow?: TreeRow< Item >;
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
	posinset,
	treeRow,
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
	const selectionCheckbox = (
		<DataViewsSelectionCheckbox
			item={ item }
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			getItemId={ getItemId }
			titleField={ titleField }
			disabled={ ! hasPossibleBulkAction }
		/>
	);
	// In tree mode, the first column starts with the expand and collapse
	// button, then the selection checkbox, indented by level.
	const label = getItemLabel( item, id, titleField );
	const rowToggle = treeRow && (
		// The slot keeps the checkbox in place when the row can't expand.
		<span className="dataviews-view-table__hierarchy-toggle-slot">
			{ treeRow.level > 0 && (
				<VisuallyHidden render={ <span /> }>
					{ sprintf(
						// translators: %d: The hierarchy level number.
						__( 'Hierarchy level %d' ),
						treeRow.level + 1
					) }
				</VisuallyHidden>
			) }
			{ treeRow.canExpand && (
				<Button
					className="dataviews-view-table__hierarchy-toggle"
					icon={ getToggleIcon( treeRow.isExpanded ) }
					label={
						treeRow.isExpanded
							? sprintf(
									// translators: %s: The item title.
									__( 'Collapse %s' ),
									label
								)
							: sprintf(
									// translators: %s: The item title.
									__( 'Expand %s' ),
									label
								)
					}
					aria-expanded={ treeRow.isExpanded }
					onClick={ () => onToggleExpanded?.( id ) }
					size="compact"
				/>
			) }
		</span>
	);
	const renderTreeCell = ( content: ReactElement ) =>
		treeRow ? (
			<div
				className="dataviews-view-table__hierarchy-cell"
				style={ {
					paddingInlineStart: `calc(${ treeRow.level } * var(--wpds-dimension-size-md))`,
				} }
			>
				{ rowToggle }
				{ hasBulkActions && selectionCheckbox }
				{ content }
			</div>
		) : (
			content
		);

	const primary = (
		<ColumnPrimary
			item={ item }
			level={ treeRow ? undefined : level }
			titleField={ showTitle ? titleField : undefined }
			mediaField={ showMedia ? mediaField : undefined }
			mediaAspectRatio={ mediaAspectRatio }
			descriptionField={ showDescription ? descriptionField : undefined }
			isItemClickable={ isItemClickable }
			onClickItem={ onClickItem }
			renderItemLink={ renderItemLink }
		/>
	);

	return (
		<tr
			className={ clsx( 'dataviews-view-table__row', {
				'is-selected': hasPossibleBulkAction && isSelected,
				'has-bulk-actions': hasPossibleBulkAction,
			} ) }
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
			{ hasBulkActions && ! treeRow && (
				<td className="dataviews-view-table__checkbox-column">
					<div className="dataviews-view-table__cell-content-wrapper">
						{ selectionCheckbox }
					</div>
				</td>
			) }
			{ hasPrimaryColumn && <td>{ renderTreeCell( primary ) }</td> }
			{ columns.map( ( column: string, index: number ) => {
				// Explicit picks the supported styles.
				const { width, maxWidth, minWidth, align } =
					view.layout?.styles?.[ column ] ?? {};
				const field = fields.find( ( f ) => f.id === column );
				const effectiveAlign = getEffectiveAlign( align, field?.type );
				const fieldCell = (
					<TableColumnField
						fields={ fields }
						item={ item }
						column={ column }
						align={ effectiveAlign }
					/>
				);

				return (
					<td
						key={ column }
						style={ {
							width,
							maxWidth,
							minWidth,
						} }
					>
						{ ! hasPrimaryColumn && index === 0
							? renderTreeCell( fieldCell )
							: fieldCell }
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
					className="dataviews-view-table__actions-column"
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
	// Grouped tables render by group and do not read the rows.
	const rows: HierarchicalRow< Item >[] =
		! dataByGroup && view.showLevels && getItemParentId
			? getHierarchicalRows( data, getItemId, getItemParentId )
			: data.map( ( item, index ) => ( {
					item,
					id: getItemId( item ) || index.toString(),
					level:
						view.showLevels && getItemLevel
							? getItemLevel( item )
							: 0,
				} ) );
	const tree =
		! dataByGroup &&
		view.showLevels &&
		getItemParentId &&
		getItemHasChildren &&
		expandedItemIds &&
		onChangeExpandedItemIds
			? getTreeRows(
					rows,
					getItemHasChildren,
					expandedItemIds,
					onChangeExpandedItemIds
				)
			: undefined;
	const isTree = !! tree;
	const renderedRows: ( HierarchicalRow< Item > | TreeRow< Item > )[] = tree
		? tree.visibleRows
		: rows;
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
	const tableHeaderRef = useRef< HTMLTableSectionElement >( null );
	const tableSelectionRef = useRef< HTMLSpanElement >( null );
	const bulkSelectionRef = useRef< HTMLSpanElement >( null );
	const bulkActionsRef = useRef< HTMLDivElement >( null );
	// Place the bulk actions toolbar over the header by writing to the DOM
	// directly: it is correct on first paint and skips a re-render. The sticky
	// offset is copied so the toolbar follows a header that consumers move.
	const syncBulkActionsPosition = () => {
		const header = tableHeaderRef.current;
		const overlay = bulkActionsRef.current;
		const win = header?.ownerDocument.defaultView;
		if ( header && overlay && win ) {
			overlay.style.setProperty(
				'--wp-dataviews-table-header-height',
				`${ header.getBoundingClientRect().height }px`
			);
			overlay.style.insetBlockStart =
				win.getComputedStyle( header ).insetBlockStart;
		}
	};
	const resizeHeaderRef = useResizeObserver< HTMLTableSectionElement >(
		syncBulkActionsPosition
	);
	const tableHeaderRefs = useMergeRefs( [ tableHeaderRef, resizeHeaderRef ] );
	const [ isActionInProgress, setIsActionInProgress ] = useState( false );
	const hasBulkActions = useSomeItemHasAPossibleBulkAction( actions, data );
	const showBulkActions =
		( hasBulkActions && selection.length > 0 ) || isActionInProgress;
	// The resize observer reports after the first paint, so measure on show.
	useLayoutEffect( syncBulkActionsPosition, [ showBulkActions ] );
	// The toolbar covers the header, so move focus between the two
	// selection checkboxes when an interaction shows or hides the toolbar.
	const focusAfterToggle = useBulkActionsFocus( {
		isShown: showBulkActions,
	} );

	const {
		hasVerticalScrollStart,
		hasHorizontalScrollStart,
		hasHorizontalScrollEnd,
	} = useScrollState( {
		scrollContainerRef: containerRef,
	} );

	const disableHeaderControls = showBulkActions;

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
		if ( disableHeaderControls ) {
			return;
		}
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
	const columnCount =
		columns.length +
		( hasPrimaryColumn ? 1 : 0 ) +
		( hasBulkActions ? 1 : 0 ) +
		( actions?.length ? 1 : 0 );
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
	if ( ! hasData && ! isActionInProgress ) {
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

	const titleHeader = titleField && (
		<ColumnHeaderMenu
			ref={ headerMenuRef( titleField.id, 0 ) }
			fieldId={ titleField.id }
			isCovered={ disableHeaderControls }
			view={ view }
			fields={ fields }
			onChangeView={ onChangeView }
			onHide={ onHide }
			setOpenedFilter={ setOpenedFilter }
			canMove={ false }
			canInsertLeft={
				isRtl ? ( view.layout?.enableMoving ?? true ) : false
			}
			canInsertRight={
				isRtl ? false : ( view.layout?.enableMoving ?? true )
			}
		/>
	);
	// In tree mode, the first header cell starts with Expand all or Collapse
	// all, then Select all.
	const expandAllToggle = tree && (
		// The slot keeps Select all in place when no row can expand.
		<span className="dataviews-view-table__hierarchy-toggle-slot">
			{ !! tree.expandableItemIds.length && (
				<Button
					className="dataviews-view-table__hierarchy-toggle"
					icon={ getToggleIcon( tree.isAllExpanded ) }
					label={
						tree.isAllExpanded
							? __( 'Collapse all' )
							: __( 'Expand all' )
					}
					onClick={ tree.onToggleAllExpanded }
					size="compact"
				/>
			) }
		</span>
	);
	// The bulk actions toolbar covers Select all while it shows.
	const selectAllCheckbox = hasBulkActions && (
		<div
			inert={ inertValue( disableHeaderControls ) }
			aria-hidden={ disableHeaderControls || undefined }
		>
			<BulkSelectionCheckbox
				checkboxRef={ tableSelectionRef }
				onSelect={ () => focusAfterToggle( bulkSelectionRef ) }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				data={ data }
				actions={ actions }
				getItemId={ getItemId }
			/>
		</div>
	);

	return (
		<>
			{ ( hasBulkActions || isActionInProgress ) && (
				<div
					className={ clsx(
						'dataviews-view-table__bulk-actions-overlay',
						{
							'is-hierarchy': isTree,
							'is-refreshing':
								! isInfiniteScroll && isDelayedLoading,
						}
					) }
					ref={ bulkActionsRef }
					hidden={ ! showBulkActions }
					inert={ inertValue( !! isLoading ) }
				>
					<BulkActionToolbar
						onActionInProgressChange={ setIsActionInProgress }
						selectionCheckboxRef={ bulkSelectionRef }
						onClearSelection={ () =>
							focusAfterToggle( tableSelectionRef )
						}
					/>
				</div>
			) }
			<table
				className={ clsx( 'dataviews-view-table', className, {
					[ `has-${ view.layout?.density }-density` ]:
						view.layout?.density &&
						[ 'compact', 'comfortable' ].includes(
							view.layout.density
						),
					'has-bulk-actions': hasBulkActions,
					'has-actions': !! actions?.length,
					'has-columns-before': hasHorizontalScrollStart,
					'has-columns-after': hasHorizontalScrollEnd,
					'is-refreshing': ! isInfiniteScroll && isDelayedLoading,
					'has-media-aspect-ratio': !! mediaAspectRatio,
				} ) }
				style={ tableStyle }
				aria-busy={ isLoading }
				aria-describedby={ tableNoticeId }
				role={ isInfiniteScroll ? 'feed' : undefined }
				inert={ inertValue( ! isInfiniteScroll && isLoading ) }
			>
				<colgroup>
					{ /* The column of the fade cell at the start of each row. */ }
					<col className="dataviews-view-table__col-scroll-fade" />
					{ hasBulkActions && ! isTree && (
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
					<WCPopover
						anchor={ contextMenuAnchor }
						onClose={ () => setContextMenuAnchor( null ) }
						placement="bottom-start"
					>
						<PropertiesSection showLabel={ false } />
					</WCPopover>
				) }
				<thead
					ref={ tableHeaderRefs }
					className={ clsx( {
						'dataviews-view-table__thead--stuck':
							hasVerticalScrollStart,
					} ) }
					onContextMenu={ handleHeaderContextMenu }
				>
					<tr className="dataviews-view-table__row">
						{ hasBulkActions && ! isTree && (
							<th
								className="dataviews-view-table__checkbox-column"
								scope="col"
								onContextMenu={ handleHeaderContextMenu }
							>
								{ selectAllCheckbox }
							</th>
						) }
						{ hasPrimaryColumn && (
							<th
								scope="col"
								aria-sort={
									view.sort?.field === titleField?.id &&
									view.sort
										? sortValues[ view.sort.direction ]
										: undefined
								}
							>
								{ tree ? (
									<div className="dataviews-view-table__hierarchy-cell">
										{ expandAllToggle }
										{ selectAllCheckbox }
										{ titleHeader }
									</div>
								) : (
									titleHeader
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
							const header = (
								<ColumnHeaderMenu
									ref={ headerMenuRef( column, index ) }
									fieldId={ column }
									isCovered={ disableHeaderControls }
									view={ view }
									fields={ fields }
									onChangeView={ onChangeView }
									onHide={ onHide }
									setOpenedFilter={ setOpenedFilter }
									canMove={ canInsertOrMove }
									canInsertLeft={ canInsertOrMove }
									canInsertRight={ canInsertOrMove }
								/>
							);
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
									{ tree &&
									! hasPrimaryColumn &&
									index === 0 ? (
										<div className="dataviews-view-table__hierarchy-cell">
											{ expandAllToggle }
											{ selectAllCheckbox }
											{ header }
										</div>
									) : (
										header
									) }
								</th>
							);
						} ) }
						{ !! actions?.length && (
							<th className="dataviews-view-table__actions-column">
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
										colSpan={ columnCount }
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
								return (
									<TableRow
										key={ id }
										item={ item }
										level={ level }
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
										treeRow={
											'canExpand' in row ? row : undefined
										}
										onToggleExpanded={
											tree?.onToggleExpanded
										}
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
						<WCSpinner />
					</p>
				</div>
			) }
		</>
	);
}

export default ViewTable;
