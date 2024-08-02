/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect, useDispatch } from '@wordpress/data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Page from '../page';
import {
	useDefaultViews,
	defaultLayouts,
} from '../sidebar-dataviews/default-views';
import {
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	LAYOUT_LIST,
} from '../../utils/constants';

import AddNewPostModal from '../add-new-post';
import { unlock } from '../../lock-unlock';
import { useEditPostAction } from '../dataviews-actions';
import { usePrevious } from '@wordpress/compose';
import usePostFields from '../post-fields';

const { usePostActions } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const EMPTY_ARRAY = [];

function useView( postType ) {
	const {
		params: { activeView = 'all', isCustom = 'false', layout },
	} = useLocation();
	const history = useHistory();
	const DEFAULT_VIEWS = useDefaultViews( { postType } );
	const selectedDefaultView = useMemo( () => {
		const defaultView =
			isCustom === 'false' &&
			DEFAULT_VIEWS[ postType ].find(
				( { slug } ) => slug === activeView
			)?.view;
		if ( isCustom === 'false' && layout ) {
			return {
				...defaultView,
				...defaultLayouts[ layout ],
				type: layout,
			};
		}
		return defaultView;
	}, [ isCustom, activeView, layout, postType, DEFAULT_VIEWS ] );
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
			...defaultLayouts[ layout ],
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
				const { params } = history.getLocationWithParams();
				history.push( {
					...params,
					layout: viewToSet.type,
				} );
			}
			setView( viewToSet );
		},
		[ history, view?.type ]
	);

	if ( isCustom === 'false' ) {
		return [ view, setDefaultViewAndUpdateUrl ];
	} else if ( isCustom === 'true' && customView ) {
		return [ customView, setCustomView ];
	}
	// Loading state where no the view was not found on custom views or default views.
	return [ DEFAULT_VIEWS[ postType ][ 0 ].view, setDefaultViewAndUpdateUrl ];
}

const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All but 'trash'.

function getItemId( item ) {
	return item.id.toString();
}

export default function PostList( { postType } ) {
	const [ view, setView ] = useView( postType );
	const history = useHistory();
	const location = useLocation();
	const { postId, quickEdit = false } = location.params;
	const [ selection, setSelection ] = useState( postId?.split( ',' ) ?? [] );
	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			const { params } = history.getLocationWithParams();
			if ( ( params.isCustom ?? 'false' ) === 'false' ) {
				history.push( {
					...params,
					postId: items.join( ',' ),
				} );
			}
		},
		[ history ]
	);

	const { isLoading: isLoadingFields, fields } = usePostFields( view.type );

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
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
	} = useEntityRecordsWithPermissions( 'postType', postType, queryArgs );

	// The REST API sort the authors by ID, but we want to sort them by name.
	const data = useMemo( () => {
		if ( ! isLoadingFields && view?.sort?.field === 'author' ) {
			return filterSortAndPaginate(
				records,
				{ sort: { ...view.sort } },
				fields
			).data;
		}

		return records;
	}, [ records, fields, isLoadingFields, view?.sort ] );

	const ids = data?.map( ( record ) => getItemId( record ) ) ?? [];
	const prevIds = usePrevious( ids ) ?? [];
	const deletedIds = prevIds.filter( ( id ) => ! ids.includes( id ) );
	const postIdWasDeleted = deletedIds.includes( postId );

	useEffect( () => {
		if ( postIdWasDeleted ) {
			history.push( {
				...history.getLocationWithParams().params,
				postId: undefined,
			} );
		}
	}, [ postIdWasDeleted, history ] );

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const { labels, canCreateRecord } = useSelect(
		( select ) => {
			const { getPostType, canUser } = select( coreStore );
			return {
				labels: getPostType( postType )?.labels,
				canCreateRecord: canUser( 'create', {
					kind: 'postType',
					name: postType,
				} ),
			};
		},
		[ postType ]
	);

	const postTypeActions = usePostActions( {
		postType,
		context: 'list',
	} );
	const editAction = useEditPostAction();
	const actions = useMemo(
		() => [ editAction, ...postTypeActions ],
		[ postTypeActions, editAction ]
	);

	const [ showAddPostModal, setShowAddPostModal ] = useState( false );

	const openModal = () => setShowAddPostModal( true );
	const closeModal = () => setShowAddPostModal( false );
	const handleNewPage = ( { type, id } ) => {
		history.push( {
			postId: id,
			postType: type,
			canvas: 'edit',
		} );
		closeModal();
	};

	return (
		<Page
			title={ labels?.name }
			actions={
				labels?.add_new_item &&
				canCreateRecord && (
					<>
						<Button
							variant="primary"
							onClick={ openModal }
							__next40pxDefaultSize
						>
							{ labels.add_new_item }
						</Button>
						{ showAddPostModal && (
							<AddNewPostModal
								postType={ postType }
								onSave={ handleNewPage }
								onClose={ closeModal }
							/>
						) }
					</>
				)
			}
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data || EMPTY_ARRAY }
				isLoading={ isLoadingData || isLoadingFields }
				view={ view }
				onChangeView={ setView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
				header={
					window.__experimentalQuickEditDataViews &&
					view.type !== LAYOUT_LIST &&
					postType === 'page' && (
						<Button
							size="compact"
							isPressed={ quickEdit }
							icon={ drawerRight }
							label={
								! quickEdit
									? __( 'Show quick edit sidebar' )
									: __( 'Close quick edit sidebar' )
							}
							onClick={ () => {
								history.push( {
									...location.params,
									quickEdit: quickEdit ? undefined : true,
								} );
							} }
						/>
					)
				}
			/>
		</Page>
	);
}
