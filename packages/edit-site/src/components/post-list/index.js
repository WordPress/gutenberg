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
import { useEvent, usePrevious } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useView } from '@wordpress/views';

/**
 * Internal dependencies
 */
import {
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	LAYOUT_LIST,
} from '../../utils/constants';

import AddNewPostModal from '../add-new-post';
import { unlock } from '../../lock-unlock';
import {
	useEditPostAction,
	useQuickEditPostAction,
} from '../dataviews-actions';
import {
	defaultLayouts,
	DEFAULT_VIEW,
	getActiveViewOverridesForTab,
} from './view-utils';
import useNotesCount from './use-notes-count';
import { QuickEditModal } from './quick-edit-modal';

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
	const defaultView = DEFAULT_VIEW;
	const activeViewOverrides = useMemo(
		() => getActiveViewOverridesForTab( activeView ),
		[ activeView ]
	);
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: postType,
		slug: 'default',
		defaultView,
		activeViewOverrides,
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
	} );

	const onChangeView = useEvent( ( newView ) => {
		updateView( newView );
		if ( newView.type !== view.type ) {
			// Retrigger the routing areas resolution.
			history.invalidate();
		}
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
	useEffect( () => {
		const newSelection = postId?.split( ',' ) ?? [];
		setSelection( newSelection );
	}, [ postId ] );

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
			if ( filter.field === 'date' ) {
				// Skip if no value is set yet
				if ( ! filter.value ) {
					return;
				}
				if ( filter.operator === OPERATOR_BEFORE ) {
					filters.before = filter.value;
				} else if ( filter.operator === OPERATOR_AFTER ) {
					filters.after = filter.value;
				}
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

	const postIds = useMemo(
		() => records?.map( ( record ) => record.id ) ?? [],
		[ records ]
	);
	const { notesCount, isLoading: isLoadingNotesCount } =
		useNotesCount( postIds );

	// The REST API sort the authors by ID, but we want to sort them by name.
	const data = useMemo( () => {
		let processedRecords = records;

		if ( view?.sort?.field === 'author' ) {
			processedRecords = filterSortAndPaginate(
				records,
				{ sort: { ...view.sort } },
				fields
			).data;
		}

		if ( processedRecords ) {
			return processedRecords.map( ( record ) => ( {
				...record,
				notesCount: notesCount[ record.id ] ?? 0,
			} ) );
		}

		return processedRecords;
	}, [ records, fields, view?.sort, notesCount ] );

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
	const quickEditAction = useQuickEditPostAction();
	const actions = useMemo( () => {
		if ( ! window.__experimentalQuickEditDataViews ) {
			const editActionPrimary = { ...editAction, isPrimary: true };
			return [ editActionPrimary, ...postTypeActions ];
		}

		if ( view.type === LAYOUT_LIST ) {
			const editActionPrimary = { ...editAction, isPrimary: true };
			return [ editActionPrimary, ...postTypeActions ];
		}

		return [ editAction, quickEditAction, ...postTypeActions ];
	}, [ view.type, editAction, quickEditAction, postTypeActions ] );

	const [ showAddPostModal, setShowAddPostModal ] = useState( false );

	const openModal = () => setShowAddPostModal( true );
	const closeModal = () => setShowAddPostModal( false );
	const handleNewPage = ( { type, id } ) => {
		history.navigate( `/${ type }/${ id }?canvas=edit` );
		closeModal();
	};
	const closeQuickEditModal = () => {
		history.navigate(
			addQueryArgs( path, {
				...query,
				quickEdit: undefined,
			} )
		);
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
				isLoading={ isLoadingData || isLoadingNotesCount }
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
			/>
			{ quickEdit && ! isLoadingData && selection.length > 0 && (
				<QuickEditModal
					postType={ postType }
					postId={ selection }
					closeModal={ closeQuickEditModal }
				/>
			) }
		</Page>
	);
}
