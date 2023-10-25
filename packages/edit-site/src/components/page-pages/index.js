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
import {
	useContext,
	useMemo,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import { DataViews } from '../dataviews';
import useTrashPostAction from '../actions/trash-post';
import Media from '../media';
import DataviewsContext from '../dataviews/context';
import { DEFAULT_STATUSES } from '../dataviews/provider';

const EMPTY_ARRAY = [];
const defaultConfigPerViewType = {
	list: {},
	grid: {
		mediaField: 'featured-image',
	},
};

export default function PagePages() {
	const { view, setView } = useContext( DataviewsContext );
	// Request post statuses to get the proper labels.
	const { records: statuses } = useEntityRecords( 'root', 'status' );
	const defaultStatuses = useMemo( () => {
		return statuses === null
			? DEFAULT_STATUSES
			: statuses
					.filter( ( { slug } ) => slug !== 'trash' )
					.map( ( { slug } ) => slug )
					.sort()
					.join();
	}, [ statuses ] );

	useEffect( () => {
		// Only update the view if the statuses received from the endpoint
		// are different from the DEFAULT_STATUSES provided initially.
		//
		// The pages endpoint depends on the status endpoint via the status filter.
		// Initially, this code filters the pages request by DEFAULT_STATUTES,
		// instead of using the default (publish).
		// https://developer.wordpress.org/rest-api/reference/pages/#list-pages
		//
		// By doing so, it avoids a second request to the pages endpoint
		// upon receiving the statuses when they are the same (most common scenario).
		if ( DEFAULT_STATUSES !== defaultStatuses ) {
			setView( {
				...view,
				filters: {
					...view.filters,
					status: defaultStatuses,
				},
			} );
		}
	}, [ defaultStatuses ] );

	const queryArgs = useMemo(
		() => ( {
			per_page: view.perPage,
			page: view.page,
			_embed: 'author',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			...view.filters,
		} ),
		[ view ]
	);
	const {
		records: pages,
		isResolving: isLoadingPages,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'page', queryArgs );

	const { records: authors } = useEntityRecords( 'root', 'user', {
		has_published_posts: [ 'page' ],
	} );

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
				filters: [
					{
						type: 'enumeration',
						id: 'status',
						resetValue: defaultStatuses,
					},
				],
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

	const filters = useMemo( () => [
		{ id: 'search', type: 'search', name: __( 'Filter list' ) },
	] );

	const trashPostAction = useTrashPostAction();
	const actions = useMemo( () => [ trashPostAction ], [ trashPostAction ] );
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
				filters={ filters }
				actions={ actions }
				data={ pages || EMPTY_ARRAY }
				isLoading={ isLoadingPages }
				view={ view }
				onChangeView={ onChangeView }
			/>
		</Page>
	);
}
