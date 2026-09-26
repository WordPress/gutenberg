import {
	useParams,
	useNavigate,
	useSearch,
	Link,
	useInvalidate,
} from '@wordpress/route';
import { useView, useViewConfig } from '@wordpress/views';
import { DataViews } from '@wordpress/dataviews';
import { BreadcrumbPath, Page } from '@wordpress/admin-ui';
import type {
	View,
	Action,
	SupportedLayouts,
	Form,
} from '@wordpress/dataviews';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
import type { Post } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import {
	getActiveViewOverrides,
	viewToQuery,
	type ViewListEntry,
	type ViewOverrides,
} from './view-utils';
import { QuickEditModal } from './quick-edit-modal';
import usePageHierarchy from './use-page-hierarchy';
// Unlock WordPress private APIs
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { usePostActions, usePostFields, usePageAncestorPaths } =
	unlock( editorPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );
/**
 * Style dependencies
 */
import './style.scss';

const LAYOUT_LIST = 'list';

function getItemId( item: Post ) {
	return item.id.toString();
}

function getPageParentId( item: Post ) {
	return ( item as Post & { parent?: number } ).parent || null;
}

function getItemLevel( item: Post ) {
	return ( item as { level?: number } ).level ?? 0;
}

function PostList() {
	const { type: postType, slug = 'all' } = useParams( {
		from: '/types/$type/list/$slug',
	} );
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
		() => getActiveViewOverrides( viewList, slug ),
		[ viewList, slug ]
	);

	if ( ! defaultView ) {
		// The route canvas resolves the view configuration before the stage
		// mounts, so this only guards against the store being reset.
		return null;
	}

	return (
		<PostListView
			postType={ postType }
			slug={ slug }
			defaultView={ defaultView }
			defaultLayouts={ defaultLayouts }
			viewList={ viewList }
			activeViewOverrides={ activeViewOverrides }
			quickEditForm={ quickEditForm }
		/>
	);
}

function PostListView( {
	postType,
	slug,
	defaultView,
	defaultLayouts,
	viewList,
	activeViewOverrides,
	quickEditForm,
}: {
	postType: string;
	slug: string;
	defaultView: View;
	defaultLayouts: SupportedLayouts | undefined;
	viewList: ViewListEntry[] | undefined;
	activeViewOverrides: ViewOverrides;
	quickEditForm: Form | undefined;
} ) {
	const invalidate = useInvalidate();
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/types/$type/list/$slug' } );
	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( postType ),
		[ postType ]
	);

	const labels = postTypeObject?.labels;
	const canCreateRecord = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: postType,
			} ),
		[ postType ]
	);

	// Callback to handle URL query parameter changes
	const handleQueryParamsChange = useCallback(
		( params: { page?: number; search?: string } ) => {
			navigate( {
				search: {
					...searchParams,
					...params,
				},
			} );
		},
		[ searchParams, navigate ]
	);

	// Use the new view persistence hook
	const { view, isModified, updateView, resetToDefault } = useView( {
		kind: 'postType',
		name: postType,
		slug: 'default-new',
		defaultView,
		defaultLayouts,
		activeViewOverrides,
		queryParams: searchParams,
		onChangeQueryParams: handleQueryParamsChange,
	} );

	const onReset = () => {
		resetToDefault();
		invalidate();
	};
	const onChangeView = ( newView: View ) => {
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
			// The rendered surfaces depend on the view type,
			// so we need to retrigger the router loader when switching the view type.
			// try switching from list to table and vice versa.
			invalidate();
		}
	};

	const postTypeQuery = useMemo(
		() => viewToQuery( view, postType ),
		[ view, postType ]
	);
	const isPageHierarchy =
		postType === 'page' &&
		view.type === 'table' &&
		!! view.showLevels &&
		! view.groupBy &&
		! view.search &&
		! view.filters?.length;
	const hierarchyQuery = useMemo(
		() => ( {
			...postTypeQuery,
			page: undefined,
			orderby_hierarchy: undefined,
			per_page: postTypeQuery.per_page ?? 20,
		} ),
		[ postTypeQuery ]
	);
	const [ refreshToken, setRefreshToken ] = useState( 0 );
	const hierarchyKey = JSON.stringify( [
		postType,
		slug,
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
		ids: [] as string[],
	} );
	const expandedItemIds = expansion.key === hierarchyKey ? expansion.ids : [];
	const onChangeExpandedItemIds = ( ids: string[] ) => {
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
		records: flatPosts,
		totalItems,
		totalPages,
		isResolving,
		hasResolved,
	} = useEntityRecordsWithPermissions( 'postType', postType, postTypeQuery, {
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
	const posts = isPageHierarchy
		? hierarchy.records.map( ( item, index ) => ( {
				...item,
				permissions: hierarchyPermissions[ index ],
			} ) )
		: flatPosts;

	const allFields = usePostFields( {
		postType,
	} );
	const showPagePaths =
		postType === 'page' && view.type === 'table' && !! view.search;
	const ancestors = usePageAncestorPaths( flatPosts, showPagePaths );
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

	// Hide status column except in 'All' tab, and disable status filtering
	const fields = useMemo( () => {
		const visible = allFields
			.filter( ( field: { id: string } ) => {
				// Hide status column except in 'All' tab.
				return field.id !== 'status' || slug === 'all';
			} )
			.map( ( field: ( typeof allFields )[ number ] ) =>
				field.id === 'status' ? { ...field, filterBy: false } : field
			);
		if ( ! showPagePaths ) {
			return visible;
		}
		return [
			...visible,
			{
				id: 'pageAncestorPath',
				label: __( 'Page location' ),
				type: 'text' as const,
				filterBy: false,
				enableHiding: false,
				render: ( { item }: { item: Post } ) => {
					const path: string[] | undefined =
						ancestors.paths[ item.id ];
					if ( path?.length ) {
						return (
							<BreadcrumbPath
								items={ path.map( ( label ) => ( { label } ) ) }
							/>
						);
					}
					return !! getPageParentId( item ) && ! ancestors.loading ? (
						<small>
							{ ancestors.error ??
								__( 'Page location unavailable.' ) }
						</small>
					) : null;
				},
			},
		];
	}, [ allFields, slug, showPagePaths, ancestors ] );

	// Helper function to clean up postIds from URL after deletion
	const cleanupDeletedPostIdsFromUrl = useCallback(
		( deletedItems: Post[] ) => {
			const deletedIds = deletedItems.map( ( item: Post ) =>
				item.id.toString()
			);
			const currentPostIds = searchParams.postIds || [];
			const remainingPostIds = currentPostIds.filter(
				( id: string ) => ! deletedIds.includes( id )
			);

			if ( remainingPostIds.length !== currentPostIds.length ) {
				navigate( {
					search: {
						...searchParams,
						postIds:
							remainingPostIds.length > 0
								? remainingPostIds
								: undefined,
					},
				} );
			} else {
				// If no change in the url, the first item might have changed.
				invalidate();
			}
		},
		[ invalidate, searchParams, navigate ]
	);

	const postTypeActions: Action< Post >[] = usePostActions( {
		postType,
		context: 'list',
		onActionPerformed: ( actionId: string, items: Post[] ) => {
			if ( isPageHierarchy ) {
				setRefreshToken( ( previous ) => previous + 1 );
			}
			// Clean up URL when delete actions are performed
			if (
				actionId === 'move-to-trash' ||
				actionId === 'permanently-delete'
			) {
				cleanupDeletedPostIdsFromUrl( items );
			}
		},
	} );

	const quickEditAction = useMemo(
		() => ( {
			id: 'quick-edit',
			label: __( 'Quick Edit' ),
			icon: drawerRight,
			isPrimary: true,
			supportsBulk: true,
			isEligible( post: Post ) {
				// PostStatus only includes assignable statuses. 'trash' is managed
				// internally by WordPress, but the REST API can still return it.
				if ( ( post.status as string ) === 'trash' ) {
					return false;
				}
				return post.type === 'page';
			},
			callback( items: Post[] ) {
				navigate( {
					search: {
						...searchParams,
						quickEdit: true,
						postIds: items.map( ( item ) => item.id.toString() ),
					},
				} );
			},
		} ),
		[ navigate, searchParams ]
	);

	const actions = useMemo( () => {
		const _actions = [
			...postTypeActions?.flatMap< Action< Post > >( ( action ) => {
				switch ( action.id ) {
					case 'permanently-delete':
						return [
							{
								...action,
								isEligible( item ) {
									if ( item.type === 'attachment' ) {
										return true;
									}
									return action.isEligible?.( item ) ?? false;
								},
							},
						];

					// Media can in some circumstances need a trash option, but
					// we need to extend the REST API to support it. See
					// https://github.com/WordPress/wordpress-develop/pull/9210.
					// Once that is merged we should fix this.
					case 'move-to-trash':
						return [
							{
								...action,
								isEligible( item ) {
									if ( item.type === 'attachment' ) {
										return false;
									}
									return action.isEligible?.( item ) ?? false;
								},
							},
						];

					// Skip revisions as the admin does not support it
					case 'view-post-revisions':
						return [];
				}

				return [ action ];
			} ),
		];
		if ( view.type !== LAYOUT_LIST ) {
			_actions.unshift( quickEditAction );
		}
		return _actions;
	}, [ quickEditAction, postTypeActions, view.type ] );

	const handleTabChange = useCallback(
		( status: string ) => {
			navigate( {
				to: `/types/${ postType }/list/${ status }`,
			} );
		},
		[ navigate, postType ]
	);

	if ( ! postTypeObject ) {
		return null;
	}

	const selection = searchParams.postIds ?? [];

	// Auto-select first post in list view if none selected
	if ( view.type === 'list' && selection.length === 0 && posts?.length > 0 ) {
		selection.push( posts[ 0 ].id.toString() );
	}

	// Until list view supports multi selection, only keep the first item.
	if ( view.type === 'list' ) {
		selection.splice( 1 );
	}

	const closeQuickEditModal = () => {
		navigate( {
			search: {
				...searchParams,
				quickEdit: undefined,
			},
		} );
	};

	return (
		<Page
			title={ postTypeObject.labels?.name }
			headingLevel={ 2 }
			subTitle={ postTypeObject.labels?.description }
			className={ `${ postTypeObject.name.toLowerCase() }-page` }
			actions={
				labels?.add_new_item &&
				canCreateRecord &&
				postType !== 'attachment' && (
					<Button
						variant="primary"
						onClick={ () => {
							navigate( {
								to: `/types/${ postType }/new`,
							} );
						} }
						size="compact"
					>
						{ labels.add_new_item }
					</Button>
				)
			}
			hasPadding={ false }
		>
			{ viewList && viewList.length > 1 && (
				<div className="routes-post-list__tabs-wrapper">
					<Tabs onSelect={ handleTabChange } selectedTabId={ slug }>
						<Tabs.TabList>
							{ viewList.map( ( entry ) => (
								<Tabs.Tab
									tabId={ entry.slug }
									key={ entry.slug }
								>
									{ entry.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
					</Tabs>
				</div>
			) }
			<DataViews
				data={ posts }
				fields={ fields }
				view={ displayedView }
				onChangeView={ onChangeView }
				actions={ actions }
				isLoading={
					isPageHierarchy
						? hierarchy.isLoading
						: isResolving || ! hasResolved
				}
				paginationInfo={ {
					totalItems,
					totalPages,
				} }
				defaultLayouts={ defaultLayouts }
				getItemId={ getItemId }
				getItemLevel={ ( item ) =>
					showPagePaths ? 0 : getItemLevel( item )
				}
				{ ...( isPageHierarchy && {
					getItemParentId: getPageParentId,
					getItemHasChildren: ( item: Post ) => {
						if (
							hierarchy.records.some(
								( child ) =>
									getPageParentId( child ) === item.id
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
				selection={ selection }
				onReset={ isModified ? onReset : false }
				onChangeSelection={ ( items: string[] ) => {
					navigate( {
						search: {
							...searchParams,
							postIds: items.length > 0 ? items : undefined,
							edit:
								items.length === 0
									? undefined
									: searchParams.edit,
						},
					} );
				} }
				isItemClickable={ ( item: Post ) =>
					// Restoring comes before editing, so a trashed post's title
					// does not link to the editor. Cast because the assignable
					// statuses `status` is typed as exclude 'trash'.
					( item.status as string ) !== 'trash'
				}
				renderItemLink={ ( { item, ...props }: { item: Post } ) => (
					<Link
						to={ `/types/${ postType }/edit/${ encodeURIComponent(
							item.id
						) }` }
						{ ...props }
						onClick={ ( event ) => {
							// Temporary fix to prevent triggering
							// onChangeSelection, which would override the URL.
							event.stopPropagation();
						} }
					/>
				) }
			/>
			{ searchParams.quickEdit &&
				! isResolving &&
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

export const stage = PostList;
