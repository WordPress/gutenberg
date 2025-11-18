/**
 * WordPress dependencies
 */
import {
	useParams,
	useNavigate,
	useSearch,
	Link,
	useInvalidate,
} from '@wordpress/route';
import { useView } from '@wordpress/views';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Page } from '@wordpress/admin-ui';
import type { View, Action } from '@wordpress/dataviews';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as patternPrivateApis } from '@wordpress/patterns';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { DEFAULT_VIEW, DEFAULT_VIEWS, DEFAULT_LAYOUTS } from './view-utils';
import { previewField } from './fields/preview';
import { patternStatusField } from './fields/sync-status';
import { usePatternCategoryField } from './fields/category';
import usePatterns, { useAugmentPatternsWithPermissions } from './use-patterns';
import type { NormalizedPattern } from './use-patterns';

// Unlock WordPress private APIs
const { usePostActions, patternTitleField } = unlock( editorPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );
const { PATTERN_TYPES, CreatePatternModal } = unlock( patternPrivateApis );

/**
 * Style dependencies
 */
import './style.scss';

function PatternList() {
	const invalidate = useInvalidate();
	const { type = 'all' } = useParams( {
		from: '/patterns/list/$type',
	} );
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/patterns/list/$type' } );

	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( 'wp_block' ),
		[]
	);

	const labels = postTypeObject?.labels;
	const canCreateRecord = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_block',
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
		name: 'wp_block',
		slug: type,
		defaultView: DEFAULT_VIEW,
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
	const categoryFilter = useMemo( () => {
		const filter = view.filters?.find( ( f ) => f.field === 'category' );
		// Default to PATTERN_DEFAULT_CATEGORY if no category filter is set
		return filter?.value || 'all-patterns';
	}, [ view.filters ] );

	const syncStatusFilter = useMemo( () => {
		const filter = view.filters?.find( ( f ) => f.field === 'sync-status' );
		return filter?.value;
	}, [ view.filters ] );

	// Determine which pattern type(s) to fetch based on current tab
	const patternType = useMemo( () => {
		if ( type === 'my-patterns' ) {
			return PATTERN_TYPES.user;
		} else if ( type === 'registered' ) {
			return PATTERN_TYPES.theme;
		}
		return null; // null means fetch all types
	}, [ type ] );

	// Use the usePatterns hook to fetch and filter patterns
	const { patterns, isResolving } = usePatterns(
		patternType,
		categoryFilter,
		{
			search: view.search,
			syncStatus: syncStatusFilter,
		}
	);

	// Augment patterns with permissions
	const patternsWithPermissions =
		useAugmentPatternsWithPermissions( patterns );

	// Add pattern-specific fields
	const patternCategoryField = usePatternCategoryField();
	const fields = useMemo( () => {
		const patternFields = [
			previewField,
			patternTitleField,
			patternCategoryField,
		];

		// Add sync status field for user patterns
		if ( type === 'my-patterns' || type === 'all' ) {
			patternFields.push( patternStatusField );
		}

		// Filter and add other fields
		return patternFields;
	}, [ type, patternCategoryField ] );

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
		postType: 'wp_block',
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
		( typeSlug: string ) => {
			navigate( {
				to: `/patterns/list/${ typeSlug }`,
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
			subTitle={ __(
				'Reusable design elements for your site. Create once, use everywhere.'
			) }
			className="pattern-page"
			actions={
				<>
					{ isModified && (
						<Button
							variant="tertiary"
							size="compact"
							onClick={ onReset }
						>
							{ __( 'Reset view' ) }
						</Button>
					) }
					{ labels?.add_new_item && canCreateRecord && (
						<Button
							variant="primary"
							onClick={ () => setShowPatternModal( true ) }
							size="compact"
						>
							{ labels.add_new_item }
						</Button>
					) }
				</>
			}
			hasPadding={ false }
		>
			{ DEFAULT_VIEWS.length > 1 && (
				<div className="routes-pattern-list__tabs-wrapper">
					<Tabs
						onSelect={ handleTabChange }
						selectedTabId={ type ?? 'all' }
					>
						<Tabs.TabList>
							{ DEFAULT_VIEWS.map(
								( filter: { slug: string; label: string } ) => (
									<Tabs.Tab
										tabId={ filter.slug }
										key={ filter.slug }
									>
										{ filter.label }
									</Tabs.Tab>
								)
							) }
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
				defaultLayouts={ DEFAULT_LAYOUTS }
				selection={ selection }
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
