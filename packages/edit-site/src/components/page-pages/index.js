/**
 * WordPress dependencies
 */
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import {
	createInterpolateElement,
	useState,
	useMemo,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect, useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Page from '../page';
import { default as Link, useLink } from '../routes/link';
import {
	DEFAULT_VIEWS,
	DEFAULT_CONFIG_PER_VIEW_TYPE,
} from '../sidebar-dataviews/default-views';
import {
	LAYOUT_GRID,
	LAYOUT_TABLE,
	LAYOUT_LIST,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
} from '../../utils/constants';

import AddNewPageModal from '../add-new-page';
import Media from '../media';
import { unlock } from '../../lock-unlock';
import { useEditPostAction } from '../dataviews-actions';

const { usePostActions } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const EMPTY_ARRAY = [];

const getFormattedDate = ( dateToDisplay ) =>
	dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( dateToDisplay )
	);

function useView( postType ) {
	const { params } = useLocation();
	const { activeView = 'all', isCustom = 'false', layout } = params;
	const history = useHistory();
	const selectedDefaultView = useMemo( () => {
		const defaultView =
			isCustom === 'false' &&
			DEFAULT_VIEWS[ postType ].find(
				( { slug } ) => slug === activeView
			)?.view;
		if ( isCustom === 'false' && layout ) {
			return {
				...defaultView,
				type: layout,
				layout: {
					...( DEFAULT_CONFIG_PER_VIEW_TYPE[ layout ] || {} ),
				},
			};
		}
		return defaultView;
	}, [ isCustom, activeView, layout, postType ] );
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
		const storedView =
			editedViewRecord?.content &&
			JSON.parse( editedViewRecord?.content );
		if ( ! storedView ) {
			return storedView;
		}

		return {
			...storedView,
			layout: {
				...( DEFAULT_CONFIG_PER_VIEW_TYPE[ storedView?.type ] || {} ),
			},
		};
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

	const setDefaultViewAndUpdateUrl = useCallback(
		( viewToSet ) => {
			if ( viewToSet.type !== view?.type ) {
				history.push( {
					...params,
					layout: viewToSet.type,
				} );
			}
			setView( viewToSet );
		},
		[ params, view?.type, history ]
	);

	if ( isCustom === 'false' ) {
		return [ view, setDefaultViewAndUpdateUrl ];
	} else if ( isCustom === 'true' && customView ) {
		return [ customView, setCustomView ];
	}
	// Loading state where no the view was not found on custom views or default views.
	return [ DEFAULT_VIEWS[ postType ][ 0 ].view, setDefaultViewAndUpdateUrl ];
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

function FeaturedImage( { item, viewType } ) {
	const isDisabled = item.status === 'trash';
	const { onClick } = useLink( {
		postId: item.id,
		postType: item.type,
		canvas: 'edit',
	} );
	const hasMedia = !! item.featured_media;
	const size =
		viewType === LAYOUT_GRID
			? [ 'large', 'full', 'medium', 'thumbnail' ]
			: [ 'thumbnail', 'medium', 'large', 'full' ];
	const media = hasMedia ? (
		<Media
			className="edit-site-page-pages__featured-image"
			id={ item.featured_media }
			size={ size }
		/>
	) : null;
	const renderButton = viewType !== LAYOUT_LIST && ! isDisabled;
	return (
		<div
			className={ `edit-site-page-pages__featured-image-wrapper is-layout-${ viewType }` }
		>
			{ renderButton ? (
				<button
					className="page-pages-preview-field__button"
					type="button"
					onClick={ onClick }
					aria-label={ item.title?.rendered || __( '(no title)' ) }
				>
					{ media }
				</button>
			) : (
				media
			) }
		</div>
	);
}

export default function PagePages() {
	const postType = 'page';
	const [ view, setView ] = useView( postType );
	const history = useHistory();
	const { params } = useLocation();
	const { isCustom = 'false' } = params;

	const onSelectionChange = useCallback(
		( items ) => {
			if ( isCustom === 'false' && view?.type === LAYOUT_LIST ) {
				history.push( {
					...params,
					postId: items.length === 1 ? items[ 0 ].id : undefined,
				} );
			}
		},
		[ history, params, view?.type, isCustom ]
	);

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters.forEach( ( filter ) => {
			if (
				filter.field === 'status' &&
				filter.operator === OPERATOR_IS_ANY
			) {
				filters.status = filter.value;
			}
			if (
				filter.field === 'author' &&
				filter.operator === OPERATOR_IS_ANY
			) {
				filters.author = filter.value;
			} else if (
				filter.field === 'author' &&
				filter.operator === OPERATOR_IS_NONE
			) {
				filters.author_exclude = filter.value;
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
		useEntityRecords( 'root', 'user', { per_page: -1 } );

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const { frontPageId, postsPageId } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );

		return {
			frontPageId: siteSettings?.page_on_front,
			postsPageId: siteSettings?.page_for_posts,
		};
	} );

	const fields = useMemo(
		() => [
			{
				id: 'featured-image',
				header: __( 'Featured Image' ),
				getValue: ( { item } ) => item.featured_media,
				render: ( { item } ) => (
					<FeaturedImage item={ item } viewType={ view.type } />
				),
				enableSorting: false,
				width: '1%',
			},
			{
				header: __( 'Title' ),
				id: 'title',
				getValue: ( { item } ) => item.title?.rendered,
				render: ( { item } ) => {
					const addLink =
						[ LAYOUT_TABLE, LAYOUT_GRID ].includes( view.type ) &&
						item.status !== 'trash';
					const title = addLink ? (
						<Link
							params={ {
								postId: item.id,
								postType: item.type,
								canvas: 'edit',
							} }
						>
							{ decodeEntities( item.title?.rendered ) ||
								__( '(no title)' ) }
						</Link>
					) : (
						<span>
							{ decodeEntities( item.title?.rendered ) ||
								__( '(no title)' ) }
						</span>
					);

					let suffix = '';
					if ( item.id === frontPageId ) {
						suffix = (
							<span className="edit-site-page-pages__title-badge">
								{ __( 'Front Page' ) }
							</span>
						);
					} else if ( item.id === postsPageId ) {
						suffix = (
							<span className="edit-site-page-pages__title-badge">
								{ __( 'Posts Page' ) }
							</span>
						);
					}

					return (
						<HStack
							className="edit-site-page-pages-title"
							alignment="center"
							justify="flex-start"
						>
							{ title }
							{ suffix }
						</HStack>
					);
				},
				maxWidth: 300,
				enableHiding: false,
			},
			{
				header: __( 'Author' ),
				id: 'author',
				getValue: ( { item } ) => item._embedded?.author[ 0 ]?.name,
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
				elements: STATUSES,
				enableSorting: false,
				filterBy: {
					operators: [ OPERATOR_IS_ANY ],
				},
			},
			{
				header: __( 'Date' ),
				id: 'date',
				render: ( { item } ) => {
					const isDraftOrPrivate = [ 'draft', 'private' ].includes(
						item.status
					);
					if ( isDraftOrPrivate ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: page creation date */
								__( '<span>Modified: <time>%s</time></span>' ),
								getFormattedDate( item.date )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					const isScheduled = item.status === 'future';
					if ( isScheduled ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: page creation date */
								__( '<span>Scheduled: <time>%s</time></span>' ),
								getFormattedDate( item.date )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					// Pending & Published posts show the modified date if it's newer.
					const dateToDisplay =
						getDate( item.modified ) > getDate( item.date )
							? item.modified
							: item.date;

					const isPending = item.status === 'pending';
					if ( isPending ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: the newest of created or modified date for the page */
								__( '<span>Modified: <time>%s</time></span>' ),
								getFormattedDate( dateToDisplay )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					const isPublished = item.status === 'publish';
					if ( isPublished ) {
						return createInterpolateElement(
							sprintf(
								/* translators: %s: the newest of created or modified date for the page */
								__( '<span>Published: <time>%s</time></span>' ),
								getFormattedDate( dateToDisplay )
							),
							{
								span: <span />,
								time: <time />,
							}
						);
					}

					// Unknow status.
					return <time>{ getFormattedDate( item.date ) }</time>;
				},
			},
		],
		[ authors, view.type, frontPageId, postsPageId ]
	);

	const postTypeActions = usePostActions( 'page' );
	const editAction = useEditPostAction();
	const actions = useMemo(
		() => [ editAction, ...postTypeActions ],
		[ postTypeActions, editAction ]
	);

	const onChangeView = useCallback(
		( newView ) => {
			if ( newView.type !== view.type ) {
				newView = {
					...newView,
					layout: {
						...DEFAULT_CONFIG_PER_VIEW_TYPE[ newView.type ],
					},
				};
			}

			setView( newView );
		},
		[ view.type, setView ]
	);

	const [ showAddPageModal, setShowAddPageModal ] = useState( false );

	const openModal = () => setShowAddPageModal( true );
	const closeModal = () => setShowAddPageModal( false );
	const handleNewPage = ( { type, id } ) => {
		history.push( {
			postId: id,
			postType: type,
			canvas: 'edit',
		} );
		closeModal();
	};

	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	return (
		<Page
			title={ __( 'Pages' ) }
			actions={
				<>
					<Button variant="primary" onClick={ openModal }>
						{ __( 'Add new page' ) }
					</Button>
					{ showAddPageModal && (
						<AddNewPageModal
							onSave={ handleNewPage }
							onClose={ closeModal }
						/>
					) }
				</>
			}
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ pages || EMPTY_ARRAY }
				isLoading={ isLoadingPages || isLoadingAuthors }
				view={ view }
				onChangeView={ onChangeView }
				onSelectionChange={ onSelectionChange }
			/>
		</Page>
	);
}
