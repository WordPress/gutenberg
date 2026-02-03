/**
 * WordPress dependencies
 */
import {
	useParams,
	useNavigate,
	useSearch,
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
import { useMemo, useCallback } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import {
	DEFAULT_VIEW_LEGACY,
	getActiveViewOverridesForTabLegacy,
	DEFAULT_LAYOUTS,
} from './view-utils';
import { previewField } from './fields/preview';
import { authorField } from './fields/author';
import { descriptionField } from './fields/description';
import { useTemplatesLegacy } from './use-templates-legacy';
import AddNewTemplate from './add-new-template';

// Unlock WordPress private APIs
const { usePostActions, templateTitleField } = unlock( editorPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );

/**
 * Style dependencies
 */
import './style.scss';
import './add-new-template/style.scss';
import type { Template } from './types';

function getItemId( item: Template ) {
	return item.id.toString();
}

function TemplateListLegacy() {
	const invalidate = useInvalidate();
	const { activeView = 'all' } = useParams( {
		from: '/templates/list/$activeView',
	} );
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/templates/list/$activeView' } );
	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( 'wp_template' ),
		[]
	);
	const defaultView = DEFAULT_VIEW_LEGACY;
	const activeViewOverrides = useMemo(
		() => getActiveViewOverridesForTabLegacy( activeView ),
		[ activeView ]
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
		name: 'wp_template',
		slug: 'default-new',
		defaultView,
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

	// Fetch templates using our legacy hook
	const { records, isLoading, allRecords } = useTemplatesLegacy( activeView );

	// Get users for author field
	const users = useSelect(
		( select ) => {
			const { getUser } = select( coreStore );
			return records.reduce( ( acc: any, record: any ) => {
				if ( record.author_text ) {
					if ( ! acc[ record.author_text ] ) {
						acc[ record.author_text ] = record.author_text;
					}
				} else if ( record.author ) {
					if ( ! acc[ record.author ] ) {
						acc[ record.author ] = getUser( record.author );
					}
				}
				return acc;
			}, {} );
		},
		[ records ]
	);

	// Build fields array with author elements (no activeField or slugField in legacy mode)
	const fields = useMemo( () => {
		const elements = [];
		for ( const author in users ) {
			elements.push( {
				value: users[ author ]?.id ?? author,
				label: users[ author ]?.name ?? author,
			} );
		}
		return [
			previewField,
			templateTitleField,
			descriptionField,
			{
				...authorField,
				elements,
			},
		];
	}, [ users ] );

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

			// Handle duplicate action - navigate to All templates tab
			if ( actionId === 'duplicate-post' ) {
				navigate( {
					to: `/templates/list/all`,
				} );
			}
		},
		[ cleanupDeletedPostIdsFromUrl, navigate ]
	);

	const postTypeActions: Action< Template >[] = usePostActions( {
		postType: 'wp_template',
		context: 'list',
		onActionPerformed,
	} );

	// Legacy mode: no setActiveTemplateAction, just post type actions
	const actions = useMemo( () => {
		return postTypeActions?.flatMap< Action< Template > >( ( action ) => {
			// Skip revisions as the admin does not support it
			if ( action.id === 'view-post-revisions' ) {
				return [];
			}

			return [ action ];
		} );
	}, [ postTypeActions ] );

	// Build tabs array dynamically for legacy mode
	const tabs = useMemo( () => {
		const baseTabs = [
			{
				slug: 'all',
				label: __( 'All templates' ),
				icon: layout,
			},
		];

		// Extract unique authors from all records
		const authorMap = new Map();
		allRecords.forEach( ( record: Template ) => {
			if ( record.author_text && ! authorMap.has( record.author_text ) ) {
				authorMap.set( record.author_text, {
					slug: record.author_text,
					label: record.author_text,
				} );
			}
		} );

		const authorTabs = Array.from( authorMap.values() );

		return [ ...baseTabs, ...authorTabs ];
	}, [ allRecords ] );

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
					<AddNewTemplate />
				</>
			}
			hasPadding={ false }
		>
			{ tabs.length > 1 && (
				<div className="routes-template-list__tabs-wrapper">
					<Tabs
						onSelect={ handleTabChange }
						selectedTabId={ activeView ?? 'all' }
					>
						<Tabs.TabList>
							{ tabs.map( ( tab ) => (
								<Tabs.Tab tabId={ tab.slug } key={ tab.slug }>
									{ tab.label }
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
				isItemClickable={ () => true }
				onClickItem={ ( item ) => {
					// In legacy mode, all templates are user templates with numeric IDs
					// Navigate directly to the editor
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

export const stageLegacy = TemplateListLegacy;
