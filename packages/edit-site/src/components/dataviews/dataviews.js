/**
 * External dependencies
 */
import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	useReactTable,
} from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	VisuallyHidden,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ListView from './list-view';
import { Pagination } from './pagination';
import ViewActions from './view-actions';
import TextFilter from './text-filter';
import { moreVertical } from '@wordpress/icons';

const EMPTY_OBJECT = {};

export default function DataViews( {
	actions,
	data,
	fields,
	view,
	onChangeView,
	isLoading,
	paginationInfo,
	options: { pageCount },
} ) {
	const columns = useMemo( () => {
		let _columns = [ ...fields ];
		if ( actions?.length ) {
			_columns.push( {
				header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
				id: 'actions',
				cell: ( props ) => {
					return (
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'Actions' ) }
						>
							{ () => (
								<MenuGroup>
									{ actions.map( ( action ) => (
										<MenuItem
											key={ action.id }
											onClick={ () =>
												action.perform(
													props.row.original
												)
											}
											isDestructive={
												action.isDesctructive
											}
										>
											{ action.label }
										</MenuItem>
									) ) }
								</MenuGroup>
							) }
						</DropdownMenu>
					);
				},
				enableHiding: false,
			} );
		}
		if ( view.fields?.hidable?.length ) {
			_columns = _columns.map( ( column ) => {
				return {
					...column,
					enableHiding: view.fields.hidable.includes( column.id ),
				};
			} );
		}

		return _columns;
	}, [ fields, actions, view.fields?.hidable ] );

	const columnVisibility = useMemo( () => {
		if ( ! view.fields?.hidden?.size ) {
			return;
		}
		return Array.from( view.fields.hidden ).reduce(
			( accumulator, fieldId ) => ( {
				...accumulator,
				[ fieldId ]: false,
			} ),
			{}
		);
	}, [ view.fields?.hidden ] );

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
				).reduce( ( accumulator, [ fieldId, value ] ) => {
					if ( value ) {
						accumulator.delete( fieldId );
					} else {
						accumulator.add( fieldId );
					}
					return accumulator;
				}, new Set( currentView.fields.hidden ) );
				return {
					...currentView,
					fields: {
						...currentView.fields,
						hidden: hiddenFields,
					},
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
		pageCount,
	} );
	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 4 }>
				<HStack justify="space-between">
					<TextFilter onChange={ dataView.setGlobalFilter } />
					<ViewActions dataView={ dataView } />
				</HStack>
				{ /* This component will be selected based on viewConfigs. Now we only have the list view. */ }
				<ListView dataView={ dataView } isLoading={ isLoading } />
				<Pagination
					dataView={ dataView }
					totalItems={ paginationInfo?.totalItems }
				/>
			</VStack>
		</div>
	);
}
