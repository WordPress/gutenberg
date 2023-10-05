/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
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
import { DataViews, PAGE_SIZE_VALUES } from '../dataviews';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export default function PagePages() {
	const [ reset, setResetQuery ] = useState( ( v ) => ! v );
	const [ globalFilter, setGlobalFilter ] = useState( '' );
	const [ paginationInfo, setPaginationInfo ] = useState();
	const [ { pageIndex, pageSize }, setPagination ] = useState( {
		pageIndex: 0,
		pageSize: PAGE_SIZE_VALUES[ 0 ],
	} );
	// Request post statuses to get the proper labels.
	const { records: statuses } = useEntityRecords( 'root', 'status' );
	const postStatuses =
		statuses === null
			? EMPTY_OBJECT
			: statuses.reduce( ( acc, status ) => {
					acc[ status.slug ] = status.name;
					return acc;
			  }, EMPTY_OBJECT );

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
			status: [ 'publish', 'draft' ],
		} ),
		[
			globalFilter,
			sorting[ 0 ]?.id,
			sorting[ 0 ]?.desc,
			pageSize,
			pageIndex,
			reset,
		]
	);
	const { records: pages, isResolving: isLoadingPages } = useEntityRecords(
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
	}, [ globalFilter, pageSize, reset ] );

	const fields = useMemo(
		() => [
			{
				header: __( 'Title' ),
				id: 'title',
				accessorFn: ( page ) => page.title?.rendered || page.slug,
				cell: ( props ) => {
					const page = props.row.original;
					return (
						<VStack spacing={ 1 }>
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
				maxWidth: 400,
				sortingFn: 'alphanumeric',
				enableHiding: false,
			},
			{
				header: __( 'Author' ),
				id: 'author',
				accessorFn: ( page ) => page._embedded?.author[ 0 ]?.name,
				cell: ( props ) => {
					const author = props.row.original._embedded?.author[ 0 ];
					return (
						<a href={ `user-edit.php?user_id=${ author.id }` }>
							{ author.name }
						</a>
					);
				},
			},
			{
				header: 'Status',
				id: 'status',
				cell: ( props ) =>
					postStatuses[ props.row.original.status ] ??
					props.row.original.status,
			},
			{
				header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
				id: 'actions',
				cell: ( props ) => {
					const page = props.row.original;
					return (
						<PageActions
							postId={ page.id }
							onRemove={ () => setResetQuery() }
						/>
					);
				},
				enableHiding: false,
			},
		],
		[ postStatuses ]
	);

	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	return (
		<Page title={ __( 'Pages' ) }>
			<DataViews
				paginationInfo={ paginationInfo }
				data={ pages || EMPTY_ARRAY }
				isLoading={ isLoadingPages }
				fields={ fields }
				options={ {
					manualSorting: true,
					manualFiltering: true,
					manualPagination: true,
					enableRowSelection: true,
					state: {
						sorting,
						globalFilter,
						pagination,
					},
					pageCount: paginationInfo?.totalPages,
					onSortingChange: setSorting,
					onGlobalFilterChange: ( value ) => {
						setGlobalFilter( value );
						setPagination( { pageIndex: 0, pageSize } );
					},
					// TODO: check these callbacks and maybe reset the query when needed...
					onPaginationChange: setPagination,
					meta: { resetQuery: setResetQuery },
				} }
			/>
		</Page>
	);
}
