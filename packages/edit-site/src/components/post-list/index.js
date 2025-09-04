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
import { useEvent, usePrevious } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';

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

const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const EMPTY_ARRAY = [];

const getDefaultView = ( defaultViews, activeView ) => {
	return defaultViews.find( ( { slug } ) => slug === activeView )?.view;
};

const getCustomView = ( editedEntityRecord ) => {
	if ( ! editedEntityRecord?.content ) {
		return undefined;
	}

	const content = JSON.parse( editedEntityRecord.content );
	if ( ! content ) {
		return undefined;
	}

	return {
		...content,
		...defaultLayouts[ content.type ],
	};
};

/**
 * This function abstracts working with default & custom views by
 * providing a [ state, setState ] tuple based on the URL parameters.
 *
 * Consumers use the provided tuple to work with state
 * and don't have to deal with the specifics of default & custom views.
 *
 * @param {string} postType Post type to retrieve default views for.
 * @return {Array} The [ state, setState ] tuple.
 */
function useView( postType ) {
	const {
		path,
		query: { activeView = 'all', isCustom = 'false', layout },
	} = useLocation();
	const history = useHistory();

	const defaultViews = useDefaultViews( { postType } );
	const { editEntityRecord } = useDispatch( coreStore );
	const editedEntityRecord = useSelect(
		( select ) => {
			if ( isCustom !== 'true' ) {
				return undefined;
			}

			const { getEditedEntityRecord } = select( coreStore );
			return getEditedEntityRecord(
				'postType',
				'wp_dataviews',
				Number( activeView )
			);
		},
		[ activeView, isCustom ]
	);
	const [ view, setView ] = useState( () => {
		let initialView;
		if ( isCustom === 'true' ) {
			initialView = getCustomView( editedEntityRecord ) ?? {
				type: layout ?? LAYOUT_LIST,
			};
		} else {
			initialView = getDefaultView( defaultViews, activeView ) ?? {
				type: layout ?? LAYOUT_LIST,
			};
		}

		const type = layout ?? initialView.type;
		return {
			...initialView,
			type,
			...defaultLayouts[ type ],
		};
	} );

	const setViewWithUrlUpdate = useEvent( ( newView ) => {
		setView( newView );

		if ( isCustom === 'true' && editedEntityRecord?.id ) {
			editEntityRecord(
				'postType',
				'wp_dataviews',
				editedEntityRecord?.id,
				{
					content: JSON.stringify( newView ),
				}
			);
		}

		const currentUrlLayout = layout ?? LAYOUT_LIST;
		if ( newView.type !== currentUrlLayout ) {
			history.navigate(
				addQueryArgs( path, {
					layout: newView.type,
				} )
			);
		}
	} );

	// When layout URL param changes, update the view type
	// without affecting any other config.
	const onUrlLayoutChange = useEvent( () => {
		setView( ( prevView ) => {
			const newType = layout ?? LAYOUT_LIST;
			if ( newType === prevView.type ) {
				return prevView;
			}

			return {
				...prevView,
				type: newType,
				...defaultLayouts[ newType ],
			};
		} );
	} );
	useEffect( () => {
		onUrlLayoutChange();
	}, [ onUrlLayoutChange, layout ] );

	// When activeView or isCustom URL parameters change, reset the view.
	const onUrlActiveViewChange = useEvent( () => {
		let newView;
		if ( isCustom === 'true' ) {
			newView = getCustomView( editedEntityRecord );
		} else {
			newView = getDefaultView( defaultViews, activeView );
		}

		if ( newView ) {
			const type = layout ?? newView.type;
			setView( {
				...newView,
				type,
				...defaultLayouts[ type ],
			} );
		}
	} );
	useEffect( () => {
		onUrlActiveViewChange();
	}, [
		onUrlActiveViewChange,
		activeView,
		isCustom,
		defaultViews,
		editedEntityRecord,
	] );

	return [ view, setViewWithUrlUpdate ];
}

const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All but 'trash'.

function getItemId( item ) {
	return item.id.toString();
}

function getItemLevel( item ) {
	return item.level;
}

export default function PostList( { postType } ) {
	const [ view, setView ] = useView( postType );
	const defaultViews = useDefaultViews( { postType } );
	const history = useHistory();
	const location = useLocation();
	const {
		postId,
		quickEdit = false,
		isCustom,
		activeView = 'all',
	} = location.query;
	const [ selection, setSelection ] = useState( postId?.split( ',' ) ?? [] );
	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			if ( ( location.query.isCustom ?? 'false' ) === 'false' ) {
				history.navigate(
					addQueryArgs( location.path, {
						postId: items.join( ',' ),
					} )
				);
			}
		},
		[ location.path, location.query.isCustom, history ]
	);

	const { isLoading: isLoadingFields, fields: fields } = usePostFields( {
		postType,
	} );

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters?.forEach( ( filter ) => {
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
			orderby_hierarchy: !! view.showLevels,
			search: view.search,
			...filters,
		};
	}, [ view, activeView, defaultViews ] );
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
			history.navigate(
				addQueryArgs( location.path, {
					postId: undefined,
				} )
			);
		}
	}, [ history, postIdWasDeleted, location.path ] );

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
		history.navigate( `/${ type }/${ id }?canvas=edit` );
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
				key={ activeView + isCustom }
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data || EMPTY_ARRAY }
				isLoading={ isLoadingData || isLoadingFields }
				view={ view }
				onChangeView={ setView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isItemClickable={ ( item ) => item.status !== 'trash' }
				onClickItem={ ( { id } ) => {
					history.navigate( `/${ postType }/${ id }?canvas=edit` );
				} }
				getItemId={ getItemId }
				getItemLevel={ getItemLevel }
				defaultLayouts={ defaultLayouts }
				header={
					window.__experimentalQuickEditDataViews &&
					view.type !== LAYOUT_LIST &&
					postType === 'page' && (
						<Button
							size="compact"
							isPressed={ quickEdit }
							icon={ drawerRight }
							label={ __( 'Details' ) }
							onClick={ () => {
								history.navigate(
									addQueryArgs( location.path, {
										quickEdit: quickEdit ? undefined : true,
									} )
								);
							} }
						/>
					)
				}
			/>
		</Page>
	);
}
