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
} from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
	VisuallyHidden,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import FieldActions from './field-actions';

const {
	DropdownMenuV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	DropdownMenuSeparatorV2,
} = unlock( componentsPrivateApis );

const EMPTY_OBJECT = {};
const sortingItemsInfo = {
	asc: { icon: arrowUp, label: __( 'Sort ascending' ) },
	desc: { icon: arrowDown, label: __( 'Sort descending' ) },
};
const sortIcons = { asc: chevronUp, desc: chevronDown };
function HeaderMenu( { dataView, header } ) {
	if ( header.isPlaceholder ) {
		return null;
	}
	const text = flexRender(
		header.column.columnDef.header,
		header.getContext()
	);
	const isSortable = !! header.column.getCanSort();
	const isHidable = !! header.column.getCanHide();
	if ( ! isSortable && ! isHidable ) {
		return text;
	}
	const sortedDirection = header.column.getIsSorted();
	return (
		<DropdownMenuV2
			align="start"
			trigger={
				<Button
					icon={ sortIcons[ header.column.getIsSorted() ] }
					iconPosition="right"
					text={ text }
					style={ { padding: 0 } }
				/>
			}
		>
			{ isSortable && (
				<DropdownMenuGroupV2>
					{ Object.entries( sortingItemsInfo ).map(
						( [ direction, info ] ) => (
							<DropdownMenuItemV2
								key={ direction }
								prefix={ <Icon icon={ info.icon } /> }
								suffix={
									sortedDirection === direction && (
										<Icon icon={ check } />
									)
								}
								onSelect={ ( event ) => {
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
							</DropdownMenuItemV2>
						)
					) }
				</DropdownMenuGroupV2>
			) }
			{ isSortable && isHidable && <DropdownMenuSeparatorV2 /> }
			{ isHidable && (
				<DropdownMenuItemV2
					prefix={ <Icon icon={ unseen } /> }
					onSelect={ ( event ) => {
						event.preventDefault();
						header.column.getToggleVisibilityHandler()( event );
					} }
				>
					{ __( 'Hide' ) }
				</DropdownMenuItemV2>
			) }
		</DropdownMenuV2>
	);
}
function ViewList( {
	view,
	onChangeView,
	fields,
	actions,
	data,
	isLoading = false,
	paginationInfo,
} ) {
	const columns = useMemo( () => {
		const _columns = [
			...fields.map( ( field ) => {
				const column = { ...field };
				delete column.render;
				column.cell = ( props ) => {
					return field.render
						? field.render( { item: props.row.original } )
						: field.accessorFn( props.row.original );
				};
				return column;
			} ),
		];
		if ( actions?.length ) {
			_columns.push( {
				header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
				id: 'actions',
				cell: ( props ) => {
					return <FieldActions item={ props.row.original } />;
				},
				enableHiding: false,
			} );
		}

		return _columns;
	}, [ fields, actions ] );

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
			pagination: {
				pageIndex: view.page,
				pageSize: view.perPage,
			},
			columnVisibility: columnVisibility ?? EMPTY_OBJECT,
		},
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
			onChangeView( { ...view, search: value, page: 0 } );
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
		<div className="dataviews-list-view-wrapper">
			{ hasRows && (
				<table className="dataviews-list-view">
					<thead>
						{ dataView.getHeaderGroups().map( ( headerGroup ) => (
							<tr key={ headerGroup.id }>
								{ headerGroup.headers.map( ( header ) => (
									<th
										key={ header.id }
										colSpan={ header.colSpan }
										style={ {
											width:
												header.column.columnDef.width ||
												undefined,
											maxWidth:
												header.column.columnDef
													.maxWidth || undefined,
										} }
									>
										<HeaderMenu
											dataView={ dataView }
											header={ header }
										/>
									</th>
								) ) }
							</tr>
						) ) }
					</thead>
					<tbody>
						{ rows.map( ( row ) => (
							<tr key={ row.id }>
								{ row.getVisibleCells().map( ( cell ) => (
									<td
										key={ cell.id }
										style={ {
											width:
												cell.column.columnDef.width ||
												undefined,
											maxWidth:
												cell.column.columnDef
													.maxWidth || undefined,
										} }
									>
										{ flexRender(
											cell.column.columnDef.cell,
											cell.getContext()
										) }
									</td>
								) ) }
							</tr>
						) ) }
					</tbody>
				</table>
			) }
			{ ! hasRows && <p>{ __( 'no results' ) }</p> }
		</div>
	);
}

export default ViewList;
