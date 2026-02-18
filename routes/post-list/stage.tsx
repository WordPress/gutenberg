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
import { useMemo, useCallback } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import type { Post } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import {
	getDefaultView,
	getActiveViewOverridesForTab,
	DEFAULT_VIEWS,
	DEFAULT_LAYOUTS,
	viewToQuery,
} from './view-utils';

// Unlock WordPress private APIs
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );

/**
 * Style dependencies
 */
import './style.scss';

function getItemId( item: Post ) {
	return item.id.toString();
}

function getItemLevel( item: Post ) {
	return ( item as { level?: number } ).level ?? 0;
}

function PostList() {
	const invalidate = useInvalidate();
	const { type: postType, slug = 'all' } = useParams( {
		from: '/types/$type/list/$slug',
	} );
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

	const defaultView: View = useMemo( () => {
		return getDefaultView( postTypeObject );
	}, [ postTypeObject ] );

	const activeViewOverrides = useMemo(
		() => getActiveViewOverridesForTab( slug ),
		[ slug ]
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

	const postTypeQuery = useMemo(
		() => viewToQuery( view, postType ),
		[ view, postType ]
	);
	const {
		records: posts,
		totalItems,
		totalPages,
		isResolving,
	} = useEntityRecordsWithPermissions( 'postType', postType, postTypeQuery );

	const allFields = usePostFields( {
		postType,
	} );

	// Hide status column except in 'All' tab, and disable status filtering
	const fields = useMemo( () => {
		return allFields
			.filter( ( field: { id: string } ) => {
				// Hide status column in specific status tabs
				if ( field.id === 'status' && slug !== 'all' ) {
					return false;
				}
				return true;
			} )
			.map( ( field: { id: string; filterBy?: any } ) => {
				// Disable status field filtering since we use tabs
				if ( field.id === 'status' ) {
					return { ...field, filterBy: false };
				}
				return field;
			} );
	}, [ allFields, slug ] );

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
	}, [ postTypeActions ] );

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

	return (
		<Page
			title={ postTypeObject.labels?.name }
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
			{ DEFAULT_VIEWS.length > 1 && (
				<div className="routes-post-list__tabs-wrapper">
					<Tabs
						onSelect={ handleTabChange }
						selectedTabId={ slug ?? 'all' }
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
				getItemLevel={ getItemLevel }
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
		</Page>
	);
}

export const stage = PostList;
