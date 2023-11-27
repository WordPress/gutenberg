/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import { DataViews, viewTypeSupportsMap } from '../dataviews';
import { default as DEFAULT_VIEWS } from '../sidebar-dataviews/default-views';
import {
	useTrashPostAction,
	usePermanentlyDeletePostAction,
	useRestorePostAction,
	postRevisionsAction,
	viewPostAction,
	useEditPostAction,
} from '../actions';
import SideEditor from './side-editor';
import Media from '../media';
import { unlock } from '../../lock-unlock';
import { ENUMERATION_TYPE, OPERATOR_IN } from '../dataviews/constants';
const { useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const defaultConfigPerViewType = {
	list: {},
	grid: {
		mediaField: 'featured-image',
		primaryField: 'title',
	},
};

function useView( type ) {
	const {
		params: { activeView = 'all', isCustom = 'false' },
	} = useLocation();
	const selectedDefaultView =
		isCustom === 'false' &&
		DEFAULT_VIEWS[ type ].find( ( { slug } ) => slug === activeView )?.view;
	const [ view, setView ] = useState( selectedDefaultView );

	useEffect( () => {
		if ( selectedDefaultView ) {
			setView( selectedDefaultView );
		}
	}, [ selectedDefaultView ] );
	const editedViewRecord = useSelect(
		( select ) => {
			if ( isCustom !== 'true' ) {
				return;
			}
			const { getEditedEntityRecord } = select( coreStore );
			const dataviewRecord = getEditedEntityRecord(
				'postType',
				'wp_dataviews',
				Number( activeView )
			);
			return dataviewRecord;
		},
		[ activeView, isCustom ]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const customView = useMemo( () => {
		return (
			editedViewRecord?.content && JSON.parse( editedViewRecord?.content )
		);
	}, [ editedViewRecord?.content ] );
	const setCustomView = useCallback(
		( viewToSet ) => {
			editEntityRecord(
				'postType',
				'wp_dataviews',
				editedViewRecord?.id,
				{
					content: JSON.stringify( viewToSet ),
				}
			);
		},
		[ editEntityRecord, editedViewRecord?.id ]
	);

	if ( isCustom === 'false' ) {
		return [ view, setView ];
	} else if ( isCustom === 'true' && customView ) {
		return [ customView, setCustomView ];
	}
	// Loading state where no the view was not found on custom views or default views.
	return [ DEFAULT_VIEWS[ type ][ 0 ].view, setView ];
}

// See https://github.com/WordPress/gutenberg/issues/55886
// We do not support custom statutes at the moment.
const STATUSES = [
	{ value: 'draft', label: __( 'Draft' ) },
	{ value: 'future', label: __( 'Scheduled' ) },
	{ value: 'pending', label: __( 'Pending Review' ) },
	{ value: 'private', label: __( 'Private' ) },
	{ value: 'publish', label: __( 'Published' ) },
	{ value: 'trash', label: __( 'Trash' ) },
];
const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All but 'trash'.

export default function PagePages() {
	const postType = 'page';
	const [ view, setView ] = useView( postType );
	const [ selection, setSelection ] = useState( [] );

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters.forEach( ( filter ) => {
			if (
				filter.field === 'status' &&
				filter.operator === OPERATOR_IN
			) {
				filters.status = filter.value;
			}
			if (
				filter.field === 'author' &&
				filter.operator === OPERATOR_IN
			) {
				filters.author = filter.value;
			}
		} );
		// We want to provide a different default item for the status filter
		// than the REST API provides.
		if ( ! filters.status || filters.status === '' ) {
			filters.status = DEFAULT_STATUSES;
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
	}, [ view ] );
	const {
		records: pages,
		isResolving: isLoadingPages,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', postType, queryArgs );

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
				render: ( { item, view: { type } } ) => {
					return (
						<VStack spacing={ 1 }>
							<Heading as="h3" level={ 5 }>
								<Link
									params={ {
										postId: item.id,
										postType: item.type,
										canvas: 'edit',
									} }
									onClick={ ( event ) => {
										if (
											viewTypeSupportsMap[ type ].preview
										) {
											event.preventDefault();
											setSelection( [ item.id ] );
										}
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
				enableHiding: false,
			},
			{
				header: __( 'Author' ),
				id: 'author',
				getValue: ( { item } ) => item._embedded?.author[ 0 ]?.name,
				type: ENUMERATION_TYPE,
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
					STATUSES.find( ( { value } ) => value === item.status )
						?.label ?? item.status,
				type: ENUMERATION_TYPE,
				elements: STATUSES,
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
		[ authors ]
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
		<>
			<Page title={ __( 'Pages' ) }>
				<DataViews
					paginationInfo={ paginationInfo }
					fields={ fields }
					actions={ actions }
					data={ pages || EMPTY_ARRAY }
					getItemId={ ( item ) => item.id }
					isLoading={ isLoadingPages || isLoadingAuthors }
					view={ view }
					onChangeView={ onChangeView }
				/>
			</Page>
			{ viewTypeSupportsMap[ view.type ].preview && (
				<Page>
					<div className="edit-site-page-pages-preview">
						{ selection.length === 1 && (
							<SideEditor
								postId={ selection[ 0 ] }
								postType={ postType }
							/>
						) }
						{ selection.length !== 1 && (
							<div
								style={ {
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center',
									textAlign: 'center',
									height: '100%',
								} }
							>
								<p>{ __( 'Select a page to preview' ) }</p>
							</div>
						) }
					</div>
				</Page>
			) }
		</>
	);
}
