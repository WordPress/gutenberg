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
import { DataViews } from '@wordpress/dataviews';
import { Page } from '@wordpress/admin-ui';
import type { View, Action } from '@wordpress/dataviews';
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
import type { WpTemplatePart } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { CreateTemplatePartModal } from '@wordpress/fields';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import {
	DEFAULT_VIEW,
	getActiveFiltersForTab,
	DEFAULT_VIEWS,
	DEFAULT_LAYOUTS,
	viewToQuery,
} from './view-utils';
import { previewField } from './fields/preview';

// Unlock WordPress private APIs
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );

/**
 * Style dependencies
 */
import './style.scss';

function getItemId( item: WpTemplatePart ) {
	return item.id.toString();
}

function TemplatePartList() {
	const invalidate = useInvalidate();
	const { area = 'all' } = useParams( {
		from: '/template-parts/list/$area',
	} );
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/template-parts/list/$area' } );
	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( 'wp_template_part' ),
		[]
	);

	const labels = postTypeObject?.labels;
	const canCreateRecord = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_template_part',
			} ),
		[]
	);

	const [ showTemplatePartModal, setShowTemplatePartModal ] =
		useState( false );

	const defaultView = DEFAULT_VIEW;

	const activeFilters = useMemo(
		() => getActiveFiltersForTab( area ),
		[ area ]
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
		name: 'wp_template_part',
		slug: 'default-new',
		defaultView,
		activeFilters,
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

	const postTypeQuery = useMemo( () => viewToQuery( view ), [ view ] );
	const {
		records: posts,
		totalItems,
		totalPages,
		isResolving,
	} = useEntityRecordsWithPermissions(
		'postType',
		'wp_template_part',
		postTypeQuery
	);

	const allFields = usePostFields( {
		postType: 'wp_template_part',
	} );

	// Hide area column except in 'All' tab, hide status, and disable area filtering
	const fields = useMemo( () => {
		return [ previewField ].concat(
			allFields
				.filter( ( field: { id: string } ) => {
					// Hide area column in specific area tabs
					if ( field.id === 'area' && area !== 'all' ) {
						return false;
					}
					// Hide status - template parts don't use status
					if ( field.id === 'status' ) {
						return false;
					}
					return true;
				} )
				.map( ( field: { id: string; filterBy?: any } ) => {
					// Disable area field filtering since we use tabs
					if ( field.id === 'area' ) {
						return { ...field, filterBy: false };
					}
					return field;
				} )
		);
	}, [ allFields, area ] );

	// Helper function to clean up postIds from URL after deletion
	const cleanupDeletedPostIdsFromUrl = useCallback(
		( deletedItems: WpTemplatePart[] ) => {
			const deletedIds = deletedItems.map( ( item: WpTemplatePart ) =>
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

	const postTypeActions: Action< WpTemplatePart >[] = usePostActions( {
		postType: 'wp_template_part',
		context: 'list',
		onActionPerformed: ( actionId: string, items: WpTemplatePart[] ) => {
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
			...postTypeActions?.flatMap< Action< WpTemplatePart > >(
				( action ) => {
					// Skip revisions as the admin does not support it
					if ( action.id === 'view-post-revisions' ) {
						return [];
					}

					return [ action ];
				}
			),
		];
	}, [ postTypeActions ] );

	const handleTabChange = useCallback(
		( areaSlug: string ) => {
			navigate( {
				to: `/template-parts/list/${ areaSlug }`,
			} );
		},
		[ navigate ]
	);

	if ( ! postTypeObject ) {
		return null;
	}

	const selection = searchParams.postIds ?? [];

	// Auto-select first template part in list view if none selected
	if ( view.type === 'list' && selection.length === 0 && posts?.length > 0 ) {
		selection.push( posts[ 0 ].id.toString() );
	}

	// Until list view supports multi selection, only keep the first item.
	if ( view.type === 'list' ) {
		selection.splice( 1 );
	}

	return (
		<Page
			title={ postTypeObject.labels?.name }
			subTitle={ postTypeObject.labels?.description }
			className="template-part-page"
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
							onClick={ () => setShowTemplatePartModal( true ) }
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
				<div className="routes-template-part-list__tabs-wrapper">
					<Tabs
						onSelect={ handleTabChange }
						selectedTabId={ area ?? 'all' }
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
				getItemId={ getItemId }
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
					item: WpTemplatePart;
				} ) => (
					<Link
						to={ `/types/wp_template_part/edit/${ encodeURIComponent(
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
			{ showTemplatePartModal && (
				<CreateTemplatePartModal
					closeModal={ () => setShowTemplatePartModal( false ) }
					blocks={ [] }
					onCreate={ ( templatePart ) => {
						setShowTemplatePartModal( false );
						navigate( {
							to: `/types/wp_template_part/edit/${ encodeURIComponent(
								templatePart.id
							) }`,
						} );
					} }
					onError={ () => setShowTemplatePartModal( false ) }
					defaultArea={ area !== 'all' ? area : 'uncategorized' }
				/>
			) }
		</Page>
	);
}

export const stage = TemplatePartList;
