/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
import { useEvent, usePrevious } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useView } from '@wordpress/views';

/**
 * Internal dependencies
 */
import {
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	LAYOUT_LIST,
} from '../../utils/constants';

import AddNewPostModal from '../add-new-post';
import { unlock } from '../../lock-unlock';
import { useEditPostAction } from '../dataviews-actions';
import { defaultLayouts, getDefaultView } from './view-utils';

const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const EMPTY_ARRAY = [];

const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All but 'trash'.

function getItemId( item ) {
	return item.id.toString();
}

function getItemLevel( item ) {
	return item.level;
}

export default function PostList( { postType } ) {
	const { path, query } = useLocation();
	const { activeView = 'all', postId, quickEdit = false } = query;
	const history = useHistory();
	const postTypeObject = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			return getPostType( postType );
		},
		[ postType ]
	);
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: postType,
		slug: activeView,
		queryParams: {
			page: query.pageNumber,
			search: query.search,
		},
		onChangeQueryParams: ( newQueryParams ) => {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: newQueryParams.page,
					search: newQueryParams.search || undefined,
				} )
			);
		},
		defaultView: getDefaultView( postTypeObject, activeView ),
	} );

	const onChangeView = useEvent( ( newView ) => {
		if ( newView.type !== view.type ) {
			// Retrigger the routing areas resolution.
			history.invalidate();
		}
		updateView( newView );
	} );

	const [ selection, setSelection ] = useState( postId?.split( ',' ) ?? [] );
	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			history.navigate(
				addQueryArgs( path, {
					postId: items.join( ',' ),
				} )
			);
		},
		[ path, history ]
	);

	const fields = usePostFields( {
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
			_embed: 'author,wp:featuredmedia',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			orderby_hierarchy: !! view.showLevels,
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
		if ( view?.sort?.field === 'author' ) {
			return filterSortAndPaginate(
				records,
				{ sort: { ...view.sort } },
				fields
			).data;
		}

		return records;
	}, [ records, fields, view?.sort ] );

	const ids = data?.map( ( record ) => getItemId( record ) ) ?? [];
	const prevIds = usePrevious( ids ) ?? [];
	const deletedIds = prevIds.filter( ( id ) => ! ids.includes( id ) );
	const postIdWasDeleted = deletedIds.includes( postId );

	useEffect( () => {
		if ( postIdWasDeleted ) {
			history.navigate(
				addQueryArgs( path, {
					postId: undefined,
				} )
			);
		}
	}, [ history, postIdWasDeleted, path ] );

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
				<>
					{ isModified && (
						<Button
							__next40pxDefaultSize
							onClick={ () => {
								resetToDefault();
								history.invalidate();
							} }
						>
							{ __( 'Reset view' ) }
						</Button>
					) }
					{ labels?.add_new_item && canCreateRecord && (
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
					) }
				</>
			}
		>
			<DataViews
				key={ activeView }
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data || EMPTY_ARRAY }
				isLoading={ isLoadingData }
				view={ view }
				onChangeView={ onChangeView }
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
									addQueryArgs( path, {
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
