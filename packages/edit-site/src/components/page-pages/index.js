/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import { DataViews } from '../dataviews';
import { default as DEFAULT_VIEWS } from './default-views';
import {
	useTrashPostAction,
	usePermanentlyDeletePostAction,
	useRestorePostAction,
	postRevisionsAction,
	viewPostAction,
	useEditPostAction,
} from '../actions';
import Media from '../media';
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const defaultConfigPerViewType = {
	list: {},
	grid: {
		mediaField: 'featured-image',
	},
};

// DEFAULT_STATUSES is intentionally sorted. Items do not have spaces in between them.
// The reason for that is to match the default statuses coming from the endpoint (entity request).
export const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All statuses but 'trash'.

export default function PagePages() {
	const {
		params: { path, activeView = 'all' },
	} = useLocation();
	const initialView = DEFAULT_VIEWS.find(
		( { slug } ) => slug === activeView
	).view;
	const [ view, setView ] = useState( initialView );
	useEffect( () => {
		setView(
			DEFAULT_VIEWS.find( ( { slug } ) => slug === activeView ).view
		);
	}, [ path, activeView ] );
	const { records: statuses, isResolving: isLoadingStatus } =
		useEntityRecords( 'root', 'status' );
	const defaultStatuses = useMemo( () => {
		return statuses === null
			? DEFAULT_STATUSES
			: statuses
					.filter( ( { slug } ) => slug !== 'trash' )
					.map( ( { slug } ) => slug )
					.sort()
					.join();
	}, [ statuses ] );

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters.forEach( ( filter ) => {
			if ( filter.field === 'status' && filter.operator === 'in' ) {
				filters.status = filter.value;
			}
			if ( filter.field === 'author' && filter.operator === 'in' ) {
				filters.author = filter.value;
			}
		} );
		// We want to provide a different default item for the status filter
		// than the REST API provides.
		if ( ! filters.status || filters.status === '' ) {
			filters.status = defaultStatuses;
		}

		return {
			per_page: view.perPage,
			page: view.page,
			_embed: 'author',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			...filters,
		};
	}, [ view, defaultStatuses ] );
	const {
		records: pages,
		isResolving: isLoadingPages,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'page', queryArgs );

	const { records: authors, isResolving: isLoadingAuthors } =
		useEntityRecords( 'root', 'user' );

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const fields = useMemo(
		() => [
			{
				id: 'featured-image',
				header: __( 'Featured Image' ),
				getValue: ( { item } ) => item.featured_media,
				render: ( { item, view: currentView } ) =>
					!! item.featured_media ? (
						<Media
							className="edit-site-page-pages__featured-image"
							id={ item.featured_media }
							size={
								currentView.type === 'list'
									? [ 'thumbnail', 'medium', 'large', 'full' ]
									: [ 'large', 'full', 'medium', 'thumbnail' ]
							}
						/>
					) : null,
				enableSorting: false,
			},
			{
				header: __( 'Title' ),
				id: 'title',
				getValue: ( { item } ) => item.title?.rendered || item.slug,
				render: ( { item } ) => {
					return (
						<VStack spacing={ 1 }>
							<Heading as="h3" level={ 5 }>
								<Link
									params={ {
										postId: item.id,
										postType: item.type,
										canvas: 'edit',
									} }
								>
									{ decodeEntities(
										item.title?.rendered || item.slug
									) || __( '(no title)' ) }
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
				getValue: ( { item } ) => item._embedded?.author[ 0 ]?.name,
				render: ( { item } ) => {
					const author = item._embedded?.author[ 0 ];
					return (
						<a href={ `user-edit.php?user_id=${ author.id }` }>
							{ author.name }
						</a>
					);
				},
				filters: [ 'enumeration' ],
				elements:
					authors?.map( ( { id, name } ) => ( {
						value: id,
						label: name,
					} ) ) || [],
			},
			{
				header: __( 'Status' ),
				id: 'status',
				getValue: ( { item } ) =>
					statuses?.find( ( { slug } ) => slug === item.status )
						?.name ?? item.status,
				filters: [ 'enumeration' ],
				elements:
					statuses?.map( ( { slug, name } ) => ( {
						value: slug,
						label: name,
					} ) ) || [],
				enableSorting: false,
			},
			{
				header: __( 'Date' ),
				id: 'date',
				getValue: ( { item } ) => item.date,
				render: ( { item } ) => {
					const formattedDate = dateI18n(
						getSettings().formats.datetimeAbbreviated,
						getDate( item.date )
					);
					return <time>{ formattedDate }</time>;
				},
			},
		],
		[ statuses, authors ]
	);

	const trashPostAction = useTrashPostAction();
	const permanentlyDeletePostAction = usePermanentlyDeletePostAction();
	const restorePostAction = useRestorePostAction();
	const editPostAction = useEditPostAction();
	const actions = useMemo(
		() => [
			viewPostAction,
			trashPostAction,
			restorePostAction,
			permanentlyDeletePostAction,
			editPostAction,
			postRevisionsAction,
		],
		[
			trashPostAction,
			permanentlyDeletePostAction,
			restorePostAction,
			editPostAction,
		]
	);
	const onChangeView = useCallback(
		( viewUpdater ) => {
			let updatedView =
				typeof viewUpdater === 'function'
					? viewUpdater( view )
					: viewUpdater;
			if ( updatedView.type !== view.type ) {
				updatedView = {
					...updatedView,
					layout: {
						...defaultConfigPerViewType[ updatedView.type ],
					},
				};
			}

			setView( updatedView );
		},
		[ view, setView ]
	);

	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	return (
		<Page title={ __( 'Pages' ) }>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ pages || EMPTY_ARRAY }
				isLoading={
					isLoadingPages || isLoadingStatus || isLoadingAuthors
				}
				view={ view }
				onChangeView={ onChangeView }
			/>
		</Page>
	);
}
