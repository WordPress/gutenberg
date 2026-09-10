import {
	useParams,
	useNavigate,
	useSearch,
	useInvalidate,
} from '@wordpress/route';
import { useView, useViewConfig } from '@wordpress/views';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Page } from '@wordpress/admin-ui';
import type { View, Action, SupportedLayouts } from '@wordpress/dataviews';
import {
	store as coreStore,
	privateApis as corePrivateApis,
} from '@wordpress/core-data';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';
import type { ViewListEntry, ViewOverrides } from './view-utils';
import { previewField } from './fields/preview';
import AddNewTemplate from './add-new-template';
// Unlock WordPress private APIs
const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );
const { Tabs } = unlock( componentsPrivateApis );
/**
 * Style dependencies
 */
import './style.scss';
import './add-new-template/style.scss';
import type { Template } from './types';

const TEMPLATE_POST_TYPE = 'wp_template';
const EMPTY_ARRAY: Template[] = [];

function getItemId( item: Template ) {
	return item.id.toString();
}

function TemplateList() {
	const { activeView = 'all' } = useParams( {
		from: '/templates/list/$activeView',
	} );
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = useViewConfig( {
		kind: 'postType',
		name: TEMPLATE_POST_TYPE,
	} );
	const activeViewOverrides = useMemo(
		() => viewList?.find( ( v ) => v.slug === activeView )?.view ?? {},
		[ viewList, activeView ]
	);

	if ( ! defaultView ) {
		// The route canvas resolves the view configuration before the stage
		// mounts, so this only guards against the store being reset.
		return null;
	}

	return (
		<TemplateListView
			activeView={ activeView }
			defaultView={ defaultView }
			defaultLayouts={ defaultLayouts }
			viewList={ viewList }
			activeViewOverrides={ activeViewOverrides }
		/>
	);
}

function TemplateListView( {
	activeView,
	defaultView,
	defaultLayouts,
	viewList,
	activeViewOverrides,
}: {
	activeView: string;
	defaultView: View;
	defaultLayouts: SupportedLayouts | undefined;
	viewList: ViewListEntry[] | undefined;
	activeViewOverrides: ViewOverrides;
} ) {
	const invalidate = useInvalidate();
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/templates/list/$activeView' } );
	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( TEMPLATE_POST_TYPE ),
		[]
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
		name: TEMPLATE_POST_TYPE,
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
		updateView( newView );
		if ( newView.type !== view.type ) {
			// The rendered surfaces depend on the view type,
			// so we need to retrigger the router loader when switching the view type.
			invalidate();
		}
	};

	// Fetch every template. Filtering by author happens client-side through
	// the view: the active view's locked `author` filter is applied by
	// `filterSortAndPaginate`.
	const { records: templates, isResolving: isLoading } =
		useEntityRecordsWithPermissions( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
		} );
	const records = ( templates ?? EMPTY_ARRAY ) as Template[];

	const postFields = usePostFields( { postType: TEMPLATE_POST_TYPE } );
	const fields = useMemo(
		() => [ previewField, ...postFields ],
		[ postFields ]
	);

	// Apply filtering, sorting, and pagination on the client side
	const { data: posts, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( records, view, fields );
	}, [ records, view, fields ] );

	// Helper function to clean up postIds from URL after deletion
	const cleanupDeletedPostIdsFromUrl = useCallback(
		( deletedItems: Template[] ) => {
			const deletedIds = deletedItems.map( ( item: Template ) =>
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

	const onActionPerformed = useCallback(
		( actionId: string, items: Template[] ) => {
			// Clean up URL when delete actions are performed
			if (
				actionId === 'move-to-trash' ||
				actionId === 'permanently-delete'
			) {
				cleanupDeletedPostIdsFromUrl( items );
			}
		},
		[ cleanupDeletedPostIdsFromUrl ]
	);

	const postTypeActions: Action< Template >[] = usePostActions( {
		postType: TEMPLATE_POST_TYPE,
		context: 'list',
		onActionPerformed,
	} );

	const actions = useMemo( () => {
		return postTypeActions?.flatMap< Action< Template > >( ( action ) => {
			// Skip revisions as the admin does not support it
			if ( action.id === 'view-post-revisions' ) {
				return [];
			}

			return [ action ];
		} );
	}, [ postTypeActions ] );

	const handleTabChange = useCallback(
		( viewSlug: string ) => {
			navigate( {
				to: `/templates/list/${ viewSlug }`,
			} );
		},
		[ navigate ]
	);

	if ( ! postTypeObject ) {
		return null;
	}

	const selection = searchParams.postIds ?? [];

	// Auto-select first template in list view if none selected
	if ( view.type === 'list' && selection.length === 0 && posts?.length > 0 ) {
		selection.push( posts[ 0 ].id.toString() );
	}

	// Until list view supports multi selection, only keep the first item.
	if ( view.type === 'list' ) {
		selection.splice( 1 );
	}

	return (
		<Page
			title={ __( 'Templates' ) }
			className="template-page"
			actions={ <AddNewTemplate /> }
			hasPadding={ false }
		>
			{ viewList && viewList.length > 1 && (
				<div className="routes-template-list__tabs-wrapper">
					<Tabs
						onSelect={ handleTabChange }
						selectedTabId={ activeView }
					>
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
				view={ view }
				onChangeView={ onChangeView }
				actions={ actions }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ getItemId }
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
				isItemClickable={ () => true }
				onClickItem={ ( item ) => {
					navigate( {
						to: `/types/wp_template/edit/${ encodeURIComponent(
							item.id
						) }`,
					} );
				} }
			/>
		</Page>
	);
}

export const stage = TemplateList;
