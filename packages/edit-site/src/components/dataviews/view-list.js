/**
 * External dependencies
 */
import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	useReactTable,
	flexRender,
} from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	chevronDown,
	chevronUp,
	unseen,
	check,
	arrowUp,
	arrowDown,
	chevronRightSmall,
	funnel,
} from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	useMemo,
	Children,
	Fragment,
	forwardRef,
	useState,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ItemActions from './item-actions';
import { ENUMERATION_TYPE, OPERATOR_IN } from './constants';

const {
	CompositeV2: Composite,
	CompositeRowV2: CompositeRow,
	useCompositeStoreV2: useCompositeStore,
	CompositeItemV2: CompositeItem,

	DropdownMenuV2Ariakit: DropdownMenu,
	DropdownMenuGroupV2Ariakit: DropdownMenuGroup,
	DropdownMenuItemV2Ariakit: DropdownMenuItem,
	DropdownMenuSeparatorV2Ariakit: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

const EMPTY_OBJECT = {};
const sortingItemsInfo = {
	asc: { icon: arrowUp, label: __( 'Sort ascending' ) },
	desc: { icon: arrowDown, label: __( 'Sort descending' ) },
};
const sortIcons = { asc: chevronUp, desc: chevronDown };

function Header( { dataView, header } ) {
	if ( header.isPlaceholder ) {
		return <CompositeItem render={ <td /> } focusable={ false } />;
	}

	const text = flexRender(
		header.column.columnDef.header,
		header.getContext()
	);

	const headerProps = {
		colSpan: header.colSpan,
		'data-field-id': header.id,
		style: {
			width: header.column.columnDef.width || undefined,
			maxWidth: header.column.columnDef.maxWidth || undefined,
		},
		role: 'columnheader',
		scope: 'col',
	};

	const isSortable = !! header.column.getCanSort();
	const isHidable = !! header.column.getCanHide();

	if ( ! isSortable && ! isHidable ) {
		return (
			<CompositeItem render={ <th { ...headerProps }>{ text }</th> } />
		);
	}

	const filter =
		header.column.columnDef.type === ENUMERATION_TYPE
			? {
					field: header.column.columnDef.id,
					elements: header.column.columnDef.elements || [],
			  }
			: undefined;

	const menuProps = {
		isSortable,
		isHidable,
		isFilterable: !! filter,
		filter,
		sortedDirection: header.column.getIsSorted(),
		dataView,
		header,
		text,
	};

	return (
		<th { ...headerProps }>
			<CompositeItem render={ <HeaderMenu { ...menuProps } /> } />
		</th>
	);
}

const HeaderMenu = forwardRef( function HeaderMenu(
	{
		isSortable,
		isHidable,
		isFilterable,
		filter,
		sortedDirection,
		dataView,
		header,
		text,
		...props
	},
	ref
) {
	return (
		<DropdownMenu
			ref={ ref }
			align="start"
			trigger={
				<Button
					icon={ sortIcons[ header.column.getIsSorted() ] }
					iconPosition="right"
					text={ text }
					style={ { padding: 0 } }
					{ ...props }
				/>
			}
		>
			<WithSeparators>
				{ isSortable && (
					<DropdownMenuGroup>
						{ Object.entries( sortingItemsInfo ).map(
							( [ direction, info ] ) => (
								<DropdownMenuItem
									key={ direction }
									prefix={ <Icon icon={ info.icon } /> }
									suffix={
										sortedDirection === direction && (
											<Icon icon={ check } />
										)
									}
									onClick={ ( event ) => {
										event.preventDefault();
										if ( sortedDirection === direction ) {
											dataView.resetSorting();
										} else {
											dataView.setSorting( [
												{
													id: header.column.id,
													desc: direction === 'desc',
												},
											] );
										}
									} }
								>
									{ info.label }
								</DropdownMenuItem>
							)
						) }
					</DropdownMenuGroup>
				) }
				{ isHidable && (
					<DropdownMenuItem
						prefix={ <Icon icon={ unseen } /> }
						onClick={ ( event ) => {
							event.preventDefault();
							header.column.getToggleVisibilityHandler()( event );
						} }
					>
						{ __( 'Hide' ) }
					</DropdownMenuItem>
				) }
				{ isFilterable && (
					<DropdownMenuGroup>
						<DropdownMenu
							key={ filter.field }
							trigger={
								<DropdownMenuItem
									prefix={ <Icon icon={ funnel } /> }
									suffix={
										<Icon icon={ chevronRightSmall } />
									}
								>
									{ __( 'Filter by' ) }
								</DropdownMenuItem>
							}
						>
							{ filter.elements.map( ( element ) => {
								let isActive = false;
								const columnFilters =
									dataView.getState().columnFilters;
								const columnFilter = columnFilters.find(
									( f ) =>
										Object.keys( f )[ 0 ].split(
											':'
										)[ 0 ] === filter.field
								);

								if ( columnFilter ) {
									const value =
										Object.values( columnFilter )[ 0 ];
									// Intentionally use loose comparison, so it does type conversion.
									// This covers the case where a top-level filter for the same field converts a number into a string.
									isActive = element.value == value; // eslint-disable-line eqeqeq
								}

								return (
									<DropdownMenuItem
										key={ element.value }
										suffix={
											isActive && <Icon icon={ check } />
										}
										onClick={ () => {
											const otherFilters =
												columnFilters?.filter(
													( f ) => {
														const [
															field,
															operator,
														] =
															Object.keys(
																f
															)[ 0 ].split( ':' );
														return (
															field !==
																filter.field ||
															operator !==
																OPERATOR_IN
														);
													}
												);

											dataView.setColumnFilters( [
												...otherFilters,
												{
													[ filter.field + ':in' ]:
														isActive
															? undefined
															: element.value,
												},
											] );
										} }
									>
										{ element.label }
									</DropdownMenuItem>
								);
							} ) }
						</DropdownMenu>
					</DropdownMenuGroup>
				) }
			</WithSeparators>
		</DropdownMenu>
	);
} );

function WithSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}

const Cell = forwardRef( function Cell( { cell, ...props }, ref ) {
	const [ widgetUsed, setWidgetUsed ] = useState( false );

	const Widget = forwardRef( ( widgetProps, innerRef ) => {
		useEffect( () => setWidgetUsed( true ), [] );
		return <CompositeItem ref={ innerRef } { ...widgetProps } />;
	} );

	const children = flexRender( cell.column.columnDef.cell, {
		...props,
		...cell.getContext(),
		Widget,
	} );

	const cellProps = {
		role: 'gridcell',
	};

	if ( widgetUsed ) {
		return (
			<td ref={ ref } { ...cellProps }>
				{ children }
			</td>
		);
	}

	return (
		<CompositeItem
			ref={ ref }
			{ ...props }
			render={ <td { ...cellProps } /> }
		>
			{ children }
		</CompositeItem>
	);
} );

function ViewList( {
	view,
	onChangeView,
	fields,
	actions,
	data,
	getItemId,
	isLoading = false,
	paginationInfo,
} ) {
	const compositeStore = useCompositeStore( {
		focusShift: true,
	} );
	const { setActiveId } = compositeStore;

	useEffect( () => {
		setActiveId( undefined );
	}, [ setActiveId, isLoading ] );

	const columns = useMemo( () => {
		const _columns = fields.map( ( field ) => {
			const { render, getValue, ...column } = field;
			column.cell = ( { Widget, ...props } ) => {
				return render( { item: props.row.original, view }, Widget );
			};
			if ( getValue ) {
				column.accessorFn = ( item ) => getValue( { item } );
			}
			return column;
		} );
		if ( actions?.length ) {
			_columns.push( {
				header: __( 'Actions' ),
				id: 'actions',
				cell: ( { row, Widget } ) => {
					return (
						<ItemActions
							item={ row.original }
							Widget={ Widget }
							actions={ actions }
						/>
					);
				},
				enableHiding: false,
			} );
		}

		return _columns;
	}, [ fields, actions, view ] );

	const columnVisibility = useMemo( () => {
		if ( ! view.hiddenFields?.length ) {
			return;
		}
		return view.hiddenFields.reduce(
			( accumulator, fieldId ) => ( {
				...accumulator,
				[ fieldId ]: false,
			} ),
			{}
		);
	}, [ view.hiddenFields ] );

	/**
	 * Transform the filters from the view format into the tanstack columns filter format.
	 *
	 * Input:
	 *
	 * view.filters = [
	 *   { field: 'date', operator: 'before', value: '2020-01-01' },
	 *   { field: 'date', operator: 'after', value: '2020-01-01' },
	 * ]
	 *
	 * Output:
	 *
	 * columnFilters = [
	 *   { "date:before": '2020-01-01' },
	 *   { "date:after": '2020-01-01' }
	 * ]
	 *
	 * @param {Array} filters The view filters to transform.
	 * @return {Array} The transformed TanStack column filters.
	 */
	const toTanStackColumnFilters = ( filters ) =>
		filters?.map( ( filter ) => ( {
			[ filter.field + ':' + filter.operator ]: filter.value,
		} ) );

	/**
	 * Transform the filters from the view format into the tanstack columns filter format.
	 *
	 * Input:
	 *
	 * columnFilters = [
	 *   { "date:before": '2020-01-01'},
	 *   { "date:after": '2020-01-01' }
	 * ]
	 *
	 * Output:
	 *
	 * view.filters = [
	 *   { field: 'date', operator: 'before', value: '2020-01-01' },
	 *   { field: 'date', operator: 'after', value: '2020-01-01' },
	 * ]
	 *
	 * @param {Array} filters The TanStack column filters to transform.
	 * @return {Array} The transformed view filters.
	 */
	const fromTanStackColumnFilters = ( filters ) =>
		filters.map( ( filter ) => {
			const [ key, value ] = Object.entries( filter )[ 0 ];
			const [ field, operator ] = key.split( ':' );
			return { field, operator, value };
		} );

	const dataView = useReactTable( {
		data,
		columns,
		manualSorting: true,
		manualFiltering: true,
		manualPagination: true,
		enableRowSelection: true,
		state: {
			sorting: view.sort
				? [
						{
							id: view.sort.field,
							desc: view.sort.direction === 'desc',
						},
				  ]
				: [],
			globalFilter: view.search,
			columnFilters: toTanStackColumnFilters( view.filters ),
			pagination: {
				pageIndex: view.page,
				pageSize: view.perPage,
			},
			columnVisibility: columnVisibility ?? EMPTY_OBJECT,
		},
		getRowId: getItemId,
		onSortingChange: ( sortingUpdater ) => {
			onChangeView( ( currentView ) => {
				const sort =
					typeof sortingUpdater === 'function'
						? sortingUpdater(
								currentView.sort
									? [
											{
												id: currentView.sort.field,
												desc:
													currentView.sort
														.direction === 'desc',
											},
									  ]
									: []
						  )
						: sortingUpdater;
				if ( ! sort.length ) {
					return {
						...currentView,
						sort: {},
					};
				}
				const [ { id, desc } ] = sort;
				return {
					...currentView,
					sort: { field: id, direction: desc ? 'desc' : 'asc' },
				};
			} );
		},
		onColumnVisibilityChange: ( columnVisibilityUpdater ) => {
			onChangeView( ( currentView ) => {
				const hiddenFields = Object.entries(
					columnVisibilityUpdater()
				).reduce(
					( accumulator, [ fieldId, value ] ) => {
						if ( value ) {
							return accumulator.filter(
								( id ) => id !== fieldId
							);
						}
						return [ ...accumulator, fieldId ];
					},
					[ ...( currentView.hiddenFields || [] ) ]
				);
				return {
					...currentView,
					hiddenFields,
				};
			} );
		},
		onGlobalFilterChange: ( value ) => {
			onChangeView( { ...view, search: value, page: 1 } );
		},
		onColumnFiltersChange: ( columnFiltersUpdater ) => {
			onChangeView( {
				...view,
				filters: fromTanStackColumnFilters( columnFiltersUpdater() ),
				page: 1,
			} );
		},
		onPaginationChange: ( paginationUpdater ) => {
			onChangeView( ( currentView ) => {
				const { pageIndex, pageSize } = paginationUpdater( {
					pageIndex: currentView.page,
					pageSize: currentView.perPage,
				} );
				return { ...view, page: pageIndex, perPage: pageSize };
			} );
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		pageCount: paginationInfo.totalPages,
	} );

	const { rows } = dataView.getRowModel();
	const hasRows = !! rows?.length;
	if ( isLoading ) {
		// TODO:Add spinner or progress bar..
		return <h3>{ __( 'Loading' ) }</h3>;
	}
	return (
		<Composite
			store={ compositeStore }
			className="dataviews-list-view-wrapper"
		>
			{ hasRows && (
				<table className="dataviews-list-view" role="grid">
					<thead>
						{ dataView.getHeaderGroups().map( ( headerGroup ) => (
							<CompositeRow
								render={ <tr /> }
								key={ headerGroup.id }
							>
								{ headerGroup.headers.map( ( header ) => (
									<Header
										key={ header.id }
										dataView={ dataView }
										header={ header }
									/>
								) ) }
							</CompositeRow>
						) ) }
					</thead>
					<tbody>
						{ rows.map( ( row ) => (
							<CompositeRow render={ <tr /> } key={ row.id }>
								{ row.getVisibleCells().map( ( cell ) => (
									<Cell
										key={ cell.column.id }
										cell={ cell }
										style={ {
											width:
												cell.column.columnDef.width ||
												undefined,
											maxWidth:
												cell.column.columnDef
													.maxWidth || undefined,
										} }
									/>
								) ) }
							</CompositeRow>
						) ) }
					</tbody>
				</table>
			) }
			{ ! hasRows && <p>{ __( 'no results' ) }</p> }
		</Composite>
	);
}

export default ViewList;
