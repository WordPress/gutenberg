import { BreadcrumbPath, Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEvent, usePrevious } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useView, useViewConfig } from '@wordpress/views';
import usePageHierarchy from './use-page-hierarchy';
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
import useNotesCount from './use-notes-count';
import { QuickEditModal } from './quick-edit-modal';

const { usePostActions, usePostFields, usePageAncestorPaths } =
	unlock( editorPrivateApis );
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
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
		form: quickEditForm,
	} = useViewConfig( {
		kind: 'postType',
		name: postType,
	} );
	const activeViewOverrides = useMemo(
		() => viewList?.find( ( v ) => v.slug === activeView )?.view ?? {},
		[ viewList, activeView ]
	);
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: postType,
		slug: 'default',
		defaultView,
		defaultLayouts,
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
		updateView(
			newView.descriptionField === 'pageAncestorPath'
				? {
						...newView,
						descriptionField: view.descriptionField,
						showDescription: view.showDescription,
					}
				: newView
		);
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

	const allFields = usePostFields( {
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
	const isPageHierarchy =
		postType === 'page' &&
		view.type === 'table' &&
		!! view.showLevels &&
		! view.groupBy &&
		! view.search &&
		! view.filters?.length;
	const hierarchyQuery = useMemo(
		() => ( {
			...queryArgs,
			page: undefined,
			orderby_hierarchy: undefined,
			per_page: queryArgs.per_page ?? 20,
		} ),
		[ queryArgs ]
	);
	const [ refreshToken, setRefreshToken ] = useState( 0 );
	const hierarchyKey = JSON.stringify( [
		postType,
		activeView,
		hierarchyQuery,
		refreshToken,
	] );
	const hierarchy = usePageHierarchy(
		isPageHierarchy,
		hierarchyQuery,
		hierarchyKey
	);
	const [ expansion, setExpansion ] = useState( {
		key: hierarchyKey,
		ids: [],
	} );
	const expandedItemIds = expansion.key === hierarchyKey ? expansion.ids : [];
	const onChangeExpandedItemIds = ( ids ) => {
		setExpansion( { key: hierarchyKey, ids } );
		ids.filter( ( id ) => ! expandedItemIds.includes( id ) ).forEach(
			( id ) => {
				if ( ! hierarchy.getPaginationInfo( id ) ) {
					hierarchy.load( id );
				}
			}
		);
	};
	const {
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
		hasResolved,
	} = useEntityRecordsWithPermissions( 'postType', postType, queryArgs, {
		enabled: ! isPageHierarchy,
	} );
	const hierarchyPermissions = useSelect(
		( select ) =>
			unlock( select( coreStore ) ).getEntityRecordsPermissions(
				'postType',
				postType,
				hierarchy.records.map( ( item ) => item.id.toString() )
			),
		[ postType, hierarchy.records ]
	);
	const hierarchyRecords = hierarchy.records.map( ( item, index ) => ( {
		...item,
		permissions: hierarchyPermissions[ index ],
	} ) );
	const displayedRecords = isPageHierarchy ? hierarchyRecords : records;
	const showPagePaths =
		postType === 'page' && view.type === 'table' && !! view.search;
	const ancestors = usePageAncestorPaths( records, showPagePaths );
	const displayedView = useMemo(
		() =>
			showPagePaths
				? {
						...view,
						descriptionField: 'pageAncestorPath',
						showDescription: true,
					}
				: view,
		[ view, showPagePaths ]
	);
	const fields = useMemo( () => {
		if ( ! showPagePaths ) {
			return allFields;
		}
		return [
			...allFields,
			{
				id: 'pageAncestorPath',
				label: __( 'Page location' ),
				type: 'text',
				filterBy: false,
				enableHiding: false,
				render: ( { item } ) => {
					const ancestorPath = ancestors.paths[ item.id ];
					if ( ancestorPath?.length ) {
						return (
							<BreadcrumbPath
								items={ ancestorPath.map( ( label ) => ( {
									label,
								} ) ) }
							/>
						);
					}
					return !! item.parent && ! ancestors.loading ? (
						<small>
							{ ancestors.error ??
								__( 'Page location unavailable.' ) }
						</small>
					) : null;
				},
			},
		];
	}, [ allFields, showPagePaths, ancestors ] );

	const postIds = useMemo(
		() => displayedRecords?.map( ( record ) => record.id ) ?? [],
		[ displayedRecords ]
	);
	const { notesCount, isLoading: isLoadingNotesCount } =
		useNotesCount( postIds );

	const data = useMemo(
		() =>
			displayedRecords?.map( ( record ) => ( {
				...record,
				notesCount: notesCount[ record.id ] ?? 0,
			} ) ),
		[ displayedRecords, notesCount ]
	);

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
		onActionPerformed: () => {
			if ( isPageHierarchy ) {
				setRefreshToken( ( previous ) => previous + 1 );
			}
		},
	} );
	const editAction = useEditPostAction();
	const quickEditAction = useQuickEditPostAction();
	const actions = useMemo( () => {
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
			headingLevel={ 2 }
			actions={
				<>
					{ labels?.add_new_item && canCreateRecord && (
						<>
							<Button
								variant="primary"
								onClick={ openModal }
								size="compact"
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
				isLoading={
					( isPageHierarchy
						? hierarchy.isLoading
						: isLoadingData || ! hasResolved ) ||
					isLoadingNotesCount
				}
				view={ displayedView }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isItemClickable={ ( item ) => item.status !== 'trash' }
				onClickItem={ ( { id } ) => {
					history.navigate( `/${ postType }/${ id }?canvas=edit` );
				} }
				getItemId={ getItemId }
				getItemLevel={ ( item ) =>
					showPagePaths ? 0 : getItemLevel( item )
				}
				{ ...( isPageHierarchy && {
					getItemParentId: ( item ) => item.parent || null,
					getItemHasChildren: ( item ) => {
						if (
							hierarchy.records.some(
								( child ) => child.parent === item.id
							)
						) {
							return true;
						}
						const level = hierarchy.getPaginationInfo(
							getItemId( item )
						);
						return level &&
							! level.hasMore &&
							! level.isLoading &&
							! level.error
							? false
							: undefined;
					},
					expandedItemIds,
					onChangeExpandedItemIds,
					hierarchyPagination: {
						getPaginationInfo: hierarchy.getPaginationInfo,
						onLoadMore: hierarchy.load,
					},
				} ) }
				defaultLayouts={ defaultLayouts }
				onReset={
					isModified
						? () => {
								resetToDefault();
								history.invalidate();
							}
						: false
				}
			/>
			{ quickEdit &&
				! isLoadingData &&
				selection.length > 0 &&
				view.type !== LAYOUT_LIST && (
					<QuickEditModal
						postType={ postType }
						postId={ selection }
						closeModal={ closeQuickEditModal }
						quickEditForm={ quickEditForm }
						onSaved={ () => {
							if ( isPageHierarchy ) {
								setRefreshToken( ( previous ) => previous + 1 );
							}
						} }
					/>
				) }
		</Page>
	);
}
