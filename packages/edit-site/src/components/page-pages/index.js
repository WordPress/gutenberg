/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import PageActions from '../page-actions';
import {
	DataTableRows,
	DataTableGlobalSearchInput,
	DataTablePaginationNumbers,
	DataTablePaginationTotalItems,
	DataTablePagination,
	DataTableProvider,
	DataTableActions,
} from '../datatable';

const EMPTY_ARRAY = [];

function ToggleStatusFilter( { onChange } ) {
	return (
		<ToggleGroupControl
			label="Select status"
			value="vertical"
			isBlock
			hideLabelFromVision
			isDeselectable
			onChange={ ( value ) => {
				onChange( ! value ? defaultStatus : value );
			} }
		>
			<ToggleGroupControlOption value="draft" label="Draft" />
			<ToggleGroupControlOption value="publish" label="Published" />
			<ToggleGroupControlOption value="trash" label="Trash" />
		</ToggleGroupControl>
	);
}

const defaultStatus = [ 'publish', 'draft' ];

export default function PagePages() {
	const [ globalFilter, setGlobalFilter ] = useState( '' );
	const [ rowSelection, setRowSelection ] = useState( {} );
	const [ status, setStatus ] = useState( defaultStatus );
	const [ paginationInfo, setPaginationInfo ] = useState();
	const [ { pageIndex, pageSize }, setPagination ] = useState( {
		pageIndex: 0,
		pageSize: 3,
	} );
	// TODO: probably memo other objects passed as state(ex:https://tanstack.com/table/v8/docs/examples/react/pagination-controlled).
	const pagination = useMemo(
		() => ( { pageIndex, pageSize } ),
		[ pageIndex, pageSize ]
	);
	const [ sorting, setSorting ] = useState( [
		{ order: 'desc', orderby: 'date' },
	] );
	const queryArgs = useMemo(
		() => ( {
			per_page: pageSize,
			page: pageIndex + 1, // tanstack starts from zero.
			_embed: 'author',
			order: sorting[ 0 ]?.desc ? 'desc' : 'asc',
			orderby: sorting[ 0 ]?.id,
			search: globalFilter,
			status,
		} ),
		[
			globalFilter,
			sorting[ 0 ]?.id,
			sorting[ 0 ]?.desc,
			pageSize,
			pageIndex,
			status,
		]
	);
	const { records, isResolving: isLoading } = useEntityRecords(
		'postType',
		'page',
		queryArgs
	);
	useEffect( () => {
		// Make extra request to handle controlled pagination.
		apiFetch( {
			path: addQueryArgs( '/wp/v2/pages', {
				...queryArgs,
				_fields: 'id',
			} ),
			method: 'HEAD',
			parse: false,
		} ).then( ( res ) => {
			const totalPages = parseInt( res.headers.get( 'X-WP-TotalPages' ) );
			const totalItems = parseInt( res.headers.get( 'X-WP-Total' ) );
			setPaginationInfo( {
				totalPages,
				totalItems,
			} );
		} );
		// Status should not make extra request if already did..
	}, [ globalFilter, pageSize, status.toString() ] );

	const columns = useMemo(
		() => [
			{
				header: __( 'Title' ),
				id: 'title',
				accessorFn: ( page ) => page.title?.rendered || page.slug,
				cell: ( props ) => {
					const page = props.row.original;
					return (
						<VStack>
							<Heading as="h3" level={ 5 }>
								<Link
									params={ {
										postId: page.id,
										postType: page.type,
										canvas: 'edit',
									} }
								>
									{ decodeEntities( props.getValue() ) }
								</Link>
							</Heading>
						</VStack>
					);
				},
				maxSize: 400,
				sortingFn: 'alphanumeric',
				enableHiding: false,
				// TODO: check about footers..
				// footer: ( props ) => props.column.id,
			},
			{
				header: __( 'Author' ),
				id: 'author',
				accessorFn: ( page ) => page._embedded?.author[ 0 ]?.name,
				cell: ( props ) => {
					const author = props.row.original._embedded?.author[ 0 ];
					// TODO: change to wp-admin link.
					return <a href={ author.link }>{ author.name }</a>;
				},
			},
			{
				header: 'Status',
				id: 'status',
				cell: ( props ) => props.row.original.status,
			},
			{
				header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
				id: 'actions',
				cell: ( props ) => {
					const page = props.row.original;
					return (
						<PageActions
							postId={ page.id }
							// onRemove={ () => {
							// 	Refresh data..
							// } }
						/>
					);
				},
				enableHiding: false,
			},
		],
		[]
	);

	const columnsWithFilters = applyFilters(
		'siteEditor.pageListColumns',
		columns
	);

	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	return (
		<Page title={ __( 'Pages' ) }>
			<div className="edit-site-table-wrapper">
				<DataTableProvider
					data={ records || EMPTY_ARRAY }
					columns={ columnsWithFilters }
					options={ {
						manualSorting: true,
						manualFiltering: true,
						manualPagination: true,
						// enableRowSelection: true,
						state: {
							sorting,
							globalFilter,
							pagination,
							rowSelection,
						},
						pageCount: paginationInfo?.totalPages,
						onSortingChange: setSorting,
						onGlobalFilterChange: setGlobalFilter,
						onPaginationChange: setPagination,
						onRowSelectionChange: setRowSelection,
					} }
				>
					<VStack>
						<HStack justify="space-between">
							<DataTableGlobalSearchInput />
							<ToggleStatusFilter onChange={ setStatus } />
							<DataTableActions />
						</HStack>
						<DataTableRows
							className="edit-site-table"
							isLoading={ isLoading }
						/>
						<HStack justify="space-between">
							<DataTablePaginationTotalItems
								totalItems={ paginationInfo?.totalItems }
							/>
							<DataTablePaginationNumbers />
						</HStack>
						<HStack justify="flex-start">
							<DataTablePagination
								totalItems={ paginationInfo?.totalItems }
							/>
						</HStack>
					</VStack>
				</DataTableProvider>
			</div>
		</Page>
	);
}
