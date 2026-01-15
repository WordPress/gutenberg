/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Spinner, Popover } from '@wordpress/components';
import {
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';

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
import { useIsHorizontalScrollEnd } from './use-is-horizontal-scroll-end';
import getDataByGroup from '../utils/get-data-by-group';
import { PropertiesSection } from '../../dataviews-view-config/properties-section';

/**
 * Determines the index at which the actions column should be inserted within the fields array.
 * Returns null if actions should be rendered at the end (default behavior).
 *
 * @param view        The current view configuration.
 * @param columnsCount The number of field columns.
 * @return The index to insert actions, or null for end position.
 */
function getActionsColumnIndex(
	view: ViewTableType,
	columnsCount: number
): number | null {
	const position = view.layout?.actionsPosition;
	if ( position === undefined || position === 'end' ) {
		return null; // Render at end (current behavior)
	}
	if ( position === 'start' ) {
		return 0;
	}
	// Numeric position - clamp to valid range
	return Math.max( 0, Math.min( position, columnsCount ) );
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
	actionsColumnIndex?: number | null;
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
	actionsColumnIndex,
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
	const hasActions = !! actions?.length;

	// Helper to render the actions cell
	const renderActionsCell = () =>
		hasActions ? (
			// Disable reason: we are not making the element interactive,
			// but preventing any click events from bubbling up to the
			// table row. This allows us to add a click handler to the row
			// itself (to toggle row selection) without erroneously
			// intercepting click events from ItemActions.

			/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
			<td
				key="actions-cell"
				className={ clsx( 'dataviews-view-table__actions-column', {
					'dataviews-view-table__actions-column--sticky': true,
					'dataviews-view-table__actions-column--stuck':
						isActionsColumnSticky,
				} ) }
				onClick={ ( e ) => e.stopPropagation() }
			>
				<ItemActions item={ item } actions={ actions } />
			</td>
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
		) : null;

	return (
		<tr
			className={ clsx( 'dataviews-view-table__row', {
				'is-selected': hasPossibleBulkAction && isSelected,
				'has-bulk-actions': hasPossibleBulkAction,
			} ) }
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
			{ actionsColumnIndex === 0 && renderActionsCell() }
			{ columns.flatMap( ( column: string, index: number ) => {
				// Explicit picks the supported styles.
				const { width, maxWidth, minWidth, align } =
					view.layout?.styles?.[ column ] ?? {};

				const cellElement = (
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
							align={ align }
						/>
					</td>
				);

				// Insert actions after this column if position matches
				if ( actionsColumnIndex === index + 1 ) {
					return [ cellElement, renderActionsCell() ];
				}
				return [ cellElement ];
			} ) }
			{ actionsColumnIndex === null && renderActionsCell() }
		</tr>
	);
}

function ViewTable< Item >( {
	actions,
	data,
	fields,
	getItemId,
	getItemLevel,
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
	const headerMenuRefs = useRef<
		Map< string, { node: HTMLButtonElement; fallback: string } >
	>( new Map() );
	const headerMenuToFocusRef = useRef< HTMLButtonElement >();
	const [ nextHeaderMenuToFocus, setNextHeaderMenuToFocus ] =
		useState< HTMLButtonElement >();
	const hasBulkActions = useSomeItemHasAPossibleBulkAction( actions, data );
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

	const isHorizontalScrollEnd = useIsHorizontalScrollEnd( {
		scrollContainerRef: containerRef,
		enabled: !! actions?.length,
	} );

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
	const actionsColumnIndex = getActionsColumnIndex( view, columns.length );
	const hasActions = !! actions?.length;
	const hideActionsHeader = view.layout?.hideActionsHeader ?? false;
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

	// Helper to render the actions column in colgroup
	const renderActionsCol = () =>
		hasActions ? (
			<col
				key="actions-col"
				className="dataviews-view-table__col-actions"
			/>
		) : null;

	// Helper to render the actions header cell
	const renderActionsHeader = () =>
		hasActions ? (
			<th
				key="actions-header"
				className={ clsx( 'dataviews-view-table__actions-column', {
					'dataviews-view-table__actions-column--sticky': true,
					'dataviews-view-table__actions-column--stuck':
						! isHorizontalScrollEnd,
				} ) }
			>
				{ ! hideActionsHeader && (
					<span className="dataviews-view-table-header">
						{ __( 'Actions' ) }
					</span>
				) }
			</th>
		) : null;

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
				} ) }
				aria-busy={ isLoading }
				aria-describedby={ tableNoticeId }
				role={ isInfiniteScroll ? 'feed' : undefined }
			>
				<colgroup>
					{ hasBulkActions && (
						<col className="dataviews-view-table__col-checkbox" />
					) }
					{ hasPrimaryColumn && (
						<col className="dataviews-view-table__col-first-data" />
					) }
					{ actionsColumnIndex === 0 && renderActionsCol() }
					{ columns.flatMap( ( column, index ) => {
						const colElement = (
							<col
								key={ `col-${ column }` }
								className={ clsx(
									`dataviews-view-table__col-${ column }`,
									{
										'dataviews-view-table__col-first-data':
											! hasPrimaryColumn && index === 0,
									}
								) }
							/>
						);
						// Insert actions after this column if position matches
						if ( actionsColumnIndex === index + 1 ) {
							return [ colElement, renderActionsCol() ];
						}
						return [ colElement ];
					} ) }
					{ actionsColumnIndex === null && renderActionsCol() }
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
				<thead onContextMenu={ handleHeaderContextMenu }>
					<tr className="dataviews-view-table__row">
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
										canInsertLeft={ false }
										canInsertRight={
											view.layout?.enableMoving ?? true
										}
									/>
								) }
							</th>
						) }
						{ actionsColumnIndex === 0 && renderActionsHeader() }
						{ columns.flatMap( ( column, index ) => {
							// Explicit picks the supported styles.
							const { width, maxWidth, minWidth, align } =
								view.layout?.styles?.[ column ] ?? {};
							const canInsertOrMove =
								view.layout?.enableMoving ?? true;
							const headerElement = (
								<th
									key={ column }
									style={ {
										width,
										maxWidth,
										minWidth,
										textAlign: align,
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
							// Insert actions after this column if position matches
							if ( actionsColumnIndex === index + 1 ) {
								return [ headerElement, renderActionsHeader() ];
							}
							return [ headerElement ];
						} ) }
						{ actionsColumnIndex === null && renderActionsHeader() }
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
								{ groupItems.map( ( item, index ) => (
									<TableRow
										key={ getItemId( item ) }
										item={ item }
										level={
											view.showLevels &&
											typeof getItemLevel === 'function'
												? getItemLevel( item )
												: undefined
										}
										hasBulkActions={ hasBulkActions }
										actions={ actions }
										fields={ fields }
										id={
											getItemId( item ) ||
											index.toString()
										}
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
										actionsColumnIndex={ actionsColumnIndex }
									/>
								) ) }
							</tbody>
						)
					)
				) : (
					<tbody>
						{ hasData &&
							data.map( ( item, index ) => (
								<TableRow
									key={ getItemId( item ) }
									item={ item }
									level={
										view.showLevels &&
										typeof getItemLevel === 'function'
											? getItemLevel( item )
											: undefined
									}
									hasBulkActions={ hasBulkActions }
									actions={ actions }
									fields={ fields }
									id={ getItemId( item ) || index.toString() }
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
									actionsColumnIndex={ actionsColumnIndex }
								/>
							) ) }
					</tbody>
				) }
			</table>
			<div
				className={ clsx( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! hasData && ! isLoading,
				} ) }
				id={ tableNoticeId }
			>
				{ ! hasData &&
					( isLoading ? (
						<p>
							<Spinner />
						</p>
					) : (
						empty
					) ) }
				{ hasData && isLoading && (
					<p className="dataviews-loading-more">
						<Spinner />
					</p>
				) }
			</div>
		</>
	);
}

export default ViewTable;
