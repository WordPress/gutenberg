import {
	useParams,
	useNavigate,
	useSearch,
	Link,
	useInvalidate,
} from '@wordpress/route';
import { useView, useViewConfig } from '@wordpress/views';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Page } from '@wordpress/admin-ui';
import type { View, Action, SupportedLayouts } from '@wordpress/dataviews';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import {
	privateApis as patternPrivateApis,
	// @ts-expect-error - No type declarations available for @wordpress/patterns
} from '@wordpress/patterns';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';
import {
	getActiveViewOverrides,
	type ViewListEntry,
	type ViewOverrides,
} from './view-utils';
import { previewField } from './fields/preview';
import { patternStatusField } from './fields/sync-status';
import { usePatternCategoryField } from './fields/category';
import usePatterns, { useAugmentPatternsWithPermissions } from './use-patterns';
import type { NormalizedPattern } from './use-patterns';
import ImportPatternButton from './import-pattern-button';
// Unlock WordPress private APIs
const { usePostActions, patternTitleField } = unlock( editorPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );
const { PATTERN_TYPES, CreatePatternModal } = unlock( patternPrivateApis );
/**
 * Style dependencies
 */
import './style.scss';

const PATTERN_POST_TYPE = 'wp_block';

function PatternList() {
	// The `type` param is the slug of the active view: the "all" or "my
	// patterns" entries of the view list, or a pattern category.
	const { type } = useParams( {
		from: '/patterns/list/$type',
	} );
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = useViewConfig( {
		kind: 'postType',
		name: PATTERN_POST_TYPE,
	} );
	const activeViewOverrides = useMemo(
		() => getActiveViewOverrides( viewList, type ),
		[ viewList, type ]
	);

	if ( ! defaultView ) {
		// The route loader resolves the view configuration before the stage
		// mounts, so this only guards against the store being reset.
		return null;
	}

	return (
		<PatternListView
			activeView={ type }
			defaultView={ defaultView }
			defaultLayouts={ defaultLayouts }
			viewList={ viewList }
			activeViewOverrides={ activeViewOverrides }
		/>
	);
}

function PatternListView( {
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
	const searchParams = useSearch( { from: '/patterns/list/$type' } );

	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( PATTERN_POST_TYPE ),
		[]
	);

	const labels = postTypeObject?.labels;
	const canCreateRecord = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: PATTERN_POST_TYPE,
			} ),
		[]
	);

	const [ showPatternModal, setShowPatternModal ] = useState( false );

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
		name: PATTERN_POST_TYPE,
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
			// try switching from list to table and vice versa.
			invalidate();
		}
	};

	// Extract filter values from view
	const syncStatusFilter = useMemo( () => {
		const filter = view.filters?.find( ( f ) => f.field === 'sync-status' );
		return filter?.value;
	}, [ view.filters ] );

	// Use the usePatterns hook to fetch and filter patterns. The active view
	// slug is the category to list: the server view list is made of the
	// "all" and "my patterns" entries plus the pattern categories.
	const { patterns, isResolving } = usePatterns( null, activeView, {
		search: view.search,
		syncStatus: syncStatusFilter,
	} );

	// Augment patterns with permissions
	const patternsWithPermissions =
		useAugmentPatternsWithPermissions( patterns );

	// Add pattern-specific fields
	const patternCategoryField = usePatternCategoryField();
	const fields = useMemo(
		() => [
			previewField,
			patternTitleField,
			patternCategoryField,
			patternStatusField,
		],
		[ patternCategoryField ]
	);

	// Apply client-side sorting and pagination, but NOT filtering
	// Filtering is done server-side in usePatterns hook
	const { data: posts, paginationInfo } = useMemo( () => {
		// Remove filters from view - filtering is managed server-side
		const viewWithoutFilters = { ...view };
		delete viewWithoutFilters.search; // Search also done server-side
		viewWithoutFilters.filters = []; // Remove all filters
		return filterSortAndPaginate(
			patternsWithPermissions,
			viewWithoutFilters,
			fields
		);
	}, [ patternsWithPermissions, view, fields ] );

	const { totalItems, totalPages } = paginationInfo;

	// Helper function to clean up postIds from URL after deletion
	const cleanupDeletedPostIdsFromUrl = useCallback(
		( deletedItems: NormalizedPattern[] ) => {
			const deletedIds = deletedItems.map( ( item ) => item.id );
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

	const postTypeActions: Action< any >[] = usePostActions( {
		postType: PATTERN_POST_TYPE,
		context: 'list',
		onActionPerformed: ( actionId: string, items: NormalizedPattern[] ) => {
			// Clean up URL when delete actions are performed
			if (
				actionId === 'move-to-trash' ||
				actionId === 'permanently-delete'
			) {
				cleanupDeletedPostIdsFromUrl( items );
			}
		},
	} );

	const actions = useMemo( () => {
		return [
			...postTypeActions?.flatMap< Action< any > >( ( action ) => {
				// Skip revisions as the admin does not support it
				if ( action.id === 'view-post-revisions' ) {
					return [];
				}

				return [ action ];
			} ),
		];
	}, [ postTypeActions ] );

	const handleTabChange = useCallback(
		( viewSlug: string ) => {
			navigate( {
				to: `/patterns/list/${ viewSlug }`,
			} );
		},
		[ navigate ]
	);

	if ( ! postTypeObject ) {
		return null;
	}

	const selection = searchParams.postIds ?? [];

	// Auto-select first pattern in list view if none selected
	if ( view.type === 'list' && selection.length === 0 && posts?.length > 0 ) {
		selection.push( posts[ 0 ].id );
	}

	// Until list view supports multi selection, only keep the first item.
	if ( view.type === 'list' ) {
		selection.splice( 1 );
	}

	return (
		<Page
			title={ __( 'Patterns' ) }
			headingLevel={ 2 }
			subTitle={ __(
				'Reusable design elements for your site. Create once, use everywhere.'
			) }
			className="pattern-page"
			actions={
				labels?.add_new_item &&
				canCreateRecord && (
					<>
						<ImportPatternButton />
						<Button
							variant="primary"
							onClick={ () => setShowPatternModal( true ) }
							size="compact"
						>
							{ labels.add_new_item }
						</Button>
					</>
				)
			}
			hasPadding={ false }
		>
			{ viewList && viewList.length > 1 && (
				<div className="routes-pattern-list__tabs-wrapper">
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
				isLoading={ isResolving }
				paginationInfo={ {
					totalItems,
					totalPages,
				} }
				defaultLayouts={ defaultLayouts }
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
				isItemClickable={ ( item ) =>
					item.type !== PATTERN_TYPES.theme
				}
				renderItemLink={ ( {
					item,
					...props
				}: {
					item: NormalizedPattern;
				} ) => (
					<Link
						to={ `/types/wp_block/edit/${ encodeURIComponent(
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
			{ showPatternModal && (
				<CreatePatternModal
					onClose={ () => setShowPatternModal( false ) }
					onSuccess={ ( {
						pattern,
					}: {
						pattern: NormalizedPattern;
					} ) => {
						setShowPatternModal( false );
						navigate( {
							to: `/types/wp_block/edit/${ encodeURIComponent(
								pattern.id
							) }`,
						} );
					} }
					content={ [] }
				/>
			) }
		</Page>
	);
}

export const stage = PatternList;
