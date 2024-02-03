/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect, useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';

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
	ENUMERATION_TYPE,
	LAYOUT_GRID,
	LAYOUT_TABLE,
	LAYOUT_LIST,
	OPERATOR_IN,
	OPERATOR_NOT_IN,
} from '../../utils/constants';

import {
	trashPostAction,
	usePermanentlyDeletePostAction,
	useRestorePostAction,
	postRevisionsAction,
	viewPostAction,
	useEditPostAction,
} from '../actions';
import AddNewPageModal from '../add-new-page';
import Media from '../media';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const SUPPORTED_LAYOUTS = window?.__experimentalAdminViews
	? [ LAYOUT_GRID, LAYOUT_TABLE, LAYOUT_LIST ]
	: [ LAYOUT_GRID, LAYOUT_TABLE ];

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
	if ( viewType === LAYOUT_LIST ) {
		return media;
	}
	return (
		<button
			className={ classNames( 'page-pages-preview-field__button', {
				'edit-site-page-pages__media-wrapper':
					viewType === LAYOUT_TABLE,
			} ) }
			type="button"
			onClick={ onClick }
			aria-label={ item.title?.rendered || __( '(no title)' ) }
		>
			{ media }
		</button>
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
				filter.operator === OPERATOR_IN
			) {
				filters.status = filter.value;
			}
			if (
				filter.field === 'author' &&
				filter.operator === OPERATOR_IN
			) {
				filters.author = filter.value;
			} else if (
				filter.field === 'author' &&
				filter.operator === OPERATOR_NOT_IN
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
					return [ LAYOUT_TABLE, LAYOUT_GRID ].includes(
						view.type
					) ? (
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
						decodeEntities( item.title?.rendered ) ||
							__( '(no title)' )
					);
				},
				maxWidth: 300,
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
				filterBy: {
					operators: [ OPERATOR_IN ],
					isPrimary: true,
				},
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
		[ authors, view.type ]
	);

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
		[ permanentlyDeletePostAction, restorePostAction, editPostAction ]
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
	const openModal = useCallback( () => {
		if ( ! showAddPageModal ) {
			setShowAddPageModal( true );
		}
	}, [ showAddPageModal ] );
	const closeModal = useCallback( () => {
		if ( showAddPageModal ) {
			setShowAddPageModal( false );
		}
	}, [ showAddPageModal ] );
	const handleNewPage = useCallback(
		( { type, id } ) => {
			history.push( {
				postId: id,
				postType: type,
				canvas: 'edit',
			} );
			closeModal();
		},
		[ history ]
	);

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
				supportedLayouts={ SUPPORTED_LAYOUTS }
			/>
		</Page>
	);
}
