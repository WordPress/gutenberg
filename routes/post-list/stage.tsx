/**
 * External dependencies
 */
import type { ComponentType } from 'react';

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
	Button as ComponentsButton,
	DropdownMenu,
	MenuItem,
	Notice,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useCallback, useEffect, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	drawerRight,
	moreVertical,
	page as pageIcon,
	post as postIcon,
} from '@wordpress/icons';
import type { Post, Type, WpTemplate } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import { EmptyState, Tabs } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	getDefaultView,
	getActiveViewOverridesForTab,
	DEFAULT_LAYOUTS,
	getPostTypeViewSlug,
	getTemplatePageItemId,
	viewToQuery,
} from './view-utils';
import { previewField } from '../template-list/fields/preview';
import { QuickEditModal } from './quick-edit-modal';
import { AddPageFlow } from './add-page-flow';
import ConfigureHomepageModal from './configure-homepage-modal';
import { PostTypeTemplatesTab } from './post-type-templates-tab';
import { PostListDataViewsLayout } from './dataviews-layout';
import {
	isTemplateLikeItem,
	TemplateItemBadge,
	TemplateItemPreview,
	TemplateItemTitle,
} from './template-item-renderers';

// Unlock WordPress private APIs
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { usePostActions, usePostFields, templateTitleField } =
	unlock( editorPrivateApis );

/**
 * Style dependencies
 */
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import './style.scss';

const LAYOUT_LIST = 'list';
const POST_LIST_REFRESH_STORAGE_PREFIX = 'site-editor-post-list-refresh';

type PageListItem = Post & {
	_isTemplatePage?: boolean;
};

const TemplatePreviewRender = previewField.render as ComponentType< {
	item: PageListItem;
} >;
const TemplateTitleRender = templateTitleField.render as ComponentType< {
	item: PageListItem;
} >;

function getItemId( item: PageListItem ) {
	if ( item._isTemplatePage ) {
		return getTemplatePageItemId( item.id );
	}

	return item.id.toString();
}

function getItemLevel( item: PageListItem ) {
	return ( item as { level?: number } ).level ?? 0;
}

function getPostTypeRecordsExistenceQuery( postType: string ) {
	return {
		_fields: 'id',
		page: 1,
		per_page: 1,
		status:
			postType === 'attachment'
				? 'inherit'
				: 'draft,future,pending,private,publish',
	};
}

function capitalizeFirstLetter( value: string ) {
	return value.charAt( 0 ).toLocaleUpperCase() + value.slice( 1 );
}

function getPostListRefreshStorageKey( postType: string ) {
	return `${ POST_LIST_REFRESH_STORAGE_PREFIX }:${ postType }`;
}

function getPostTypeRestPath( postType: string, postTypeObject: Type ) {
	const restNamespace =
		( postTypeObject as { rest_namespace?: string } ).rest_namespace ||
		'wp/v2';
	const restBase =
		( postTypeObject as { rest_base?: string } ).rest_base || postType;

	return `/${ restNamespace }/${ restBase }`;
}

function PostList() {
	const invalidate = useInvalidate();
	const { type: postType } = useParams( {
		from: '/types/$type/list/$slug',
	} );
	const navigate = useNavigate();
	const [ isAddingPage, setIsAddingPage ] = useState( false );
	const [ isConfiguringHomepage, setIsConfiguringHomepage ] =
		useState( false );
	const [ postListRefreshKey, setPostListRefreshKey ] = useState<
		string | undefined
	>();
	const searchParams = useSearch( { from: '/types/$type/list/$slug' } );
	const activeContentTab =
		searchParams.content === 'templates' ? 'templates' : 'content';

	useEffect( () => {
		if ( postType === 'page' && searchParams.configureHomepage ) {
			setIsConfiguringHomepage( true );
		}
	}, [ postType, searchParams.configureHomepage ] );

	const closeConfigureHomepageModal = useCallback( () => {
		setIsConfiguringHomepage( false );

		if ( searchParams.configureHomepage ) {
			navigate( {
				search: {
					...searchParams,
					configureHomepage: undefined,
				},
			} );
		}
	}, [ navigate, searchParams ] );

	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( postType ),
		[ postType ]
	);
	const { receiveEntityRecords } = useDispatch( coreStore );

	useEffect( () => {
		try {
			const storageKey = getPostListRefreshStorageKey( postType );
			const refreshKey = window.sessionStorage.getItem( storageKey );

			if ( ! refreshKey ) {
				return;
			}

			window.sessionStorage.removeItem( storageKey );
			setPostListRefreshKey( refreshKey );
		} catch {
			// Storage can be unavailable in private browsing contexts. In that
			// case, normal core-data resolution will continue to be used.
		}
	}, [ postType ] );

	const labels = postTypeObject?.labels;
	const canCreateRecord = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: postType,
			} ),
		[ postType ]
	);
	const homepageSettings = useSelect(
		( select ) => {
			if ( postType !== 'page' ) {
				return {
					needsAttention: false,
					showOnFront: undefined,
				};
			}

			const siteSettings = select( coreStore ).getEntityRecord(
				'root',
				'site'
			) as
				| {
						show_on_front?: string;
						page_on_front?: number;
						page_for_posts?: number;
						home?: string;
						url?: string;
				  }
				| undefined;
			const frontPageId =
				siteSettings?.show_on_front === 'page'
					? siteSettings.page_on_front
					: undefined;

			return {
				needsAttention:
					siteSettings?.show_on_front === 'page' &&
					( ! siteSettings.page_on_front ||
						! siteSettings.page_for_posts ),
				showOnFront: siteSettings?.show_on_front,
				homeUrl: siteSettings?.home || siteSettings?.url,
				frontPageId,
				frontPage: frontPageId
					? ( select( coreStore ).getEntityRecord(
							'postType',
							'page',
							frontPageId
					  ) as Post )
					: undefined,
			};
		},
		[ postType ]
	);
	const latestPostsTemplatePage = useSelect(
		( select ) => {
			if (
				postType !== 'page' ||
				homepageSettings.showOnFront !== 'posts'
			) {
				return undefined;
			}

			const store = select( coreStore );
			const templateId = store.getDefaultTemplateId( {
				// The front-page lookup follows the WordPress template hierarchy,
				// so it can resolve the Blog Home template or another fallback.
				slug: 'front-page',
			} );
			const template = templateId
				? ( store.getEntityRecord(
						'postType',
						'wp_template',
						templateId
				  ) as WpTemplate | undefined )
				: undefined;

			if ( ! template ) {
				return undefined;
			}

			return {
				...template,
				type: 'wp_template',
				status: 'publish',
				link: homepageSettings.homeUrl,
				excerpt: {
					rendered: template.description || '',
				},
				_isTemplatePage: true,
			} as PageListItem;
		},
		[ homepageSettings.homeUrl, homepageSettings.showOnFront, postType ]
	);
	const homepageSettingsNeedAttention = homepageSettings.needsAttention;

	const defaultView: View = useMemo( () => {
		return getDefaultView( postTypeObject );
	}, [ postTypeObject ] );

	const activeViewOverrides = useMemo(
		() => getActiveViewOverridesForTab(),
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
		name: postType,
		slug: getPostTypeViewSlug( postType ),
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
		hasResolved,
	} = useEntityRecordsWithPermissions( 'postType', postType, postTypeQuery );
	const postTypeRecordsExistenceQuery = useMemo(
		() => getPostTypeRecordsExistenceQuery( postType ),
		[ postType ]
	);
	const {
		totalItems: totalExistingRecords,
		hasResolved: hasResolvedExistingRecords,
	} = useEntityRecordsWithPermissions(
		'postType',
		postType,
		postTypeRecordsExistenceQuery
	);

	useEffect( () => {
		if ( ! postListRefreshKey || ! postTypeObject ) {
			return;
		}

		let isCurrent = true;

		const refreshPostListRecords = async () => {
			try {
				const response = ( await apiFetch( {
					path: addQueryArgs(
						getPostTypeRestPath( postType, postTypeObject ),
						postTypeQuery
					),
					parse: false,
				} ) ) as Response;

				const refreshedPosts = await response.json();
				if ( ! isCurrent ) {
					return;
				}

				receiveEntityRecords(
					'postType',
					postType,
					refreshedPosts,
					postTypeQuery,
					true,
					undefined,
					{
						totalItems: Number(
							response.headers.get( 'X-WP-Total' )
						),
						totalPages: Number(
							response.headers.get( 'X-WP-TotalPages' )
						),
					}
				);
				invalidate();
			} catch {
				// Fall back to the existing core-data records if the explicit
				// bridge refresh fails.
			}
		};

		refreshPostListRecords();

		return () => {
			isCurrent = false;
		};
	}, [
		invalidate,
		postListRefreshKey,
		postType,
		postTypeObject,
		postTypeQuery,
		receiveEntityRecords,
	] );
	const displayedPosts = useMemo( () => {
		if ( postType !== 'page' ) {
			return posts;
		}

		if ( latestPostsTemplatePage ) {
			return [ latestPostsTemplatePage, ...( posts || [] ) ];
		}

		const frontPage = homepageSettings.frontPage;
		if ( ! frontPage?.id ) {
			return posts;
		}

		return [
			frontPage,
			...( posts || [] ).filter(
				( post: Post ) => post.id !== frontPage.id
			),
		];
	}, [
		homepageSettings.frontPage,
		latestPostsTemplatePage,
		postType,
		posts,
	] );

	const allFields = usePostFields( {
		postType,
	} );
	const fields = useMemo( () => {
		const mappedFields = allFields.map( ( field ) => {
			if (
				field.type === 'media' ||
				field.id === 'content-preview' ||
				field.id === 'featured_media'
			) {
				return {
					...field,
					render( props: { item: PageListItem } ) {
						if ( isTemplateLikeItem( props.item ) ) {
							return (
								<TemplateItemPreview>
									<TemplatePreviewRender
										item={ props.item }
									/>
								</TemplateItemPreview>
							);
						}

						const Render = field.render as ComponentType<
							typeof props
						>;
						return <Render { ...props } />;
					},
				};
			}

			if ( field.id === 'title' ) {
				return {
					...field,
					render( props: { item: PageListItem } ) {
						if ( isTemplateLikeItem( props.item ) ) {
							return (
								<TemplateItemTitle
									badgeLabel={
										props.item._isTemplatePage
											? __( 'Homepage' )
											: undefined
									}
								>
									<TemplateTitleRender item={ props.item } />
								</TemplateItemTitle>
							);
						}

						const Render = field.render as ComponentType<
							typeof props
						>;
						return <Render { ...props } />;
					},
				};
			}

			if ( field.id === 'status' ) {
				return {
					...field,
					render( props: { item: PageListItem } ) {
						if ( isTemplateLikeItem( props.item ) ) {
							return (
								<TemplateItemBadge>
									{ __( 'Active' ) }
								</TemplateItemBadge>
							);
						}

						const Render = field.render as ComponentType<
							typeof props
						>;
						return <Render { ...props } />;
					},
				};
			}

			return field;
		} );

		if (
			! mappedFields.some( ( field ) => field.id === 'content-preview' )
		) {
			mappedFields.push( {
				id: 'content-preview',
				type: 'media',
				label: __( 'Content preview' ),
				enableSorting: false,
				render( props: { item: PageListItem } ) {
					if ( isTemplateLikeItem( props.item ) ) {
						return (
							<TemplateItemPreview>
								<TemplatePreviewRender item={ props.item } />
							</TemplateItemPreview>
						);
					}

					return (
						<span className="dataviews-view-grid__media-placeholder" />
					);
				},
			} );
		}

		return mappedFields;
	}, [ allFields ] );
	const dataView = useMemo(
		() =>
			postType === 'page'
				? {
						...view,
						mediaField: 'content-preview',
				  }
				: view,
		[ postType, view ]
	);

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

	const postTypeActions: Action< PageListItem >[] = usePostActions( {
		postType,
		context: 'list',
		onActionPerformed: ( actionId: string, items: PageListItem[] ) => {
			// Clean up URL when delete actions are performed
			if (
				actionId === 'move-to-trash' ||
				actionId === 'permanently-delete'
			) {
				cleanupDeletedPostIdsFromUrl( items as Post[] );
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
			isEligible( post: PageListItem ) {
				if ( post._isTemplatePage ) {
					return false;
				}

				// PostStatus only includes assignable statuses. 'trash' is managed
				// internally by WordPress, but the REST API can still return it.
				if ( ( post.status as string ) === 'trash' ) {
					return false;
				}
				return post.type === 'page';
			},
			callback( items: PageListItem[] ) {
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
			...postTypeActions?.flatMap< Action< PageListItem > >(
				( action ) => {
					switch ( action.id ) {
						case 'permanently-delete':
							return [
								{
									...action,
									isEligible( item ) {
										if ( item._isTemplatePage ) {
											return false;
										}

										if ( item.type === 'attachment' ) {
											return true;
										}
										return (
											action.isEligible?.( item ) ?? false
										);
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
										if ( item._isTemplatePage ) {
											return false;
										}

										if ( item.type === 'attachment' ) {
											return false;
										}
										return (
											action.isEligible?.( item ) ?? false
										);
									},
								},
							];

						// Skip revisions as the admin does not support it
						case 'view-post-revisions':
							return [];
					}

					return [
						{
							...action,
							isEligible( item ) {
								if ( item._isTemplatePage ) {
									return false;
								}

								return action.isEligible?.( item ) ?? true;
							},
						},
					];
				}
			),
		];
		if ( view.type !== LAYOUT_LIST ) {
			_actions.unshift( quickEditAction );
		}
		return _actions;
	}, [ quickEditAction, postTypeActions, view.type ] );

	const openAddNewFlow = useCallback( () => {
		if ( postType === 'page' ) {
			setIsAddingPage( true );
			return;
		}

		navigate( {
			to: `/types/${ postType }/new`,
		} );
	}, [ navigate, postType ] );

	const handleContentTabChange = useCallback(
		( contentTab: string ) => {
			navigate( {
				to: `/types/${ postType }/list/all`,
				search: {
					...searchParams,
					content:
						contentTab === 'templates' ? 'templates' : undefined,
					edit: undefined,
					page: undefined,
					postIds: undefined,
					quickEdit: undefined,
					search: undefined,
				},
			} );
		},
		[ navigate, postType, searchParams ]
	);

	if ( ! postTypeObject ) {
		return null;
	}

	const selection = [ ...( searchParams.postIds ?? [] ) ];

	// Auto-select first post in list view if none selected
	if (
		view.type === 'list' &&
		selection.length === 0 &&
		displayedPosts?.length > 0
	) {
		selection.push( getItemId( displayedPosts[ 0 ] as PageListItem ) );
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

	const pageHeaderActions = (
		<>
			{ labels?.add_new_item && canCreateRecord && (
				<ComponentsButton
					variant="primary"
					onClick={ openAddNewFlow }
					size="compact"
					__next40pxDefaultSize
				>
					{ labels.add_new_item }
				</ComponentsButton>
			) }
			<DropdownMenu
				icon={ moreVertical }
				label={
					homepageSettingsNeedAttention
						? __(
								'More page options. Homepage settings need attention.'
						  )
						: __( 'More page options' )
				}
				className={
					homepageSettingsNeedAttention
						? 'routes-post-list__more-options is-attention'
						: 'routes-post-list__more-options'
				}
				popoverProps={ { placement: 'bottom-end' } }
				toggleProps={ {
					variant: 'tertiary',
					__next40pxDefaultSize: true,
				} }
			>
				{ ( { onClose: closeMenu } ) => (
					<MenuItem
						onClick={ () => {
							setIsConfiguringHomepage( true );
							closeMenu();
						} }
					>
						{ __( 'Configure Homepage' ) }
					</MenuItem>
				) }
			</DropdownMenu>
		</>
	);

	const postListActions =
		postType === 'page'
			? pageHeaderActions
			: labels?.add_new_item &&
			  canCreateRecord &&
			  postType !== 'attachment' && (
					<ComponentsButton
						variant="primary"
						onClick={ openAddNewFlow }
						size="compact"
						__next40pxDefaultSize
					>
						{ labels.add_new_item }
					</ComponentsButton>
			  );
	const postTypePluralLabel =
		labels?.name || postTypeObject.labels?.name || postType;
	const postTypeSingularLabel =
		labels?.singular_name ||
		postTypeObject.labels?.singular_name ||
		postTypePluralLabel;
	const postTypePluralLabelCapitalized =
		capitalizeFirstLetter( postTypePluralLabel );
	const postTypeSingularLabelCapitalized = capitalizeFirstLetter(
		postTypeSingularLabel
	);
	const hasNoExistingRecords =
		hasResolvedExistingRecords && totalExistingRecords === 0;
	const emptyState = hasNoExistingRecords ? (
		<EmptyState.Root>
			<EmptyState.Icon
				icon={ postType === 'page' ? pageIcon : postIcon }
			/>
			<EmptyState.Title>
				{ sprintf(
					// translators: %s: Post type plural label, e.g. "posts", "pages", or "products".
					__( 'No %s yet' ),
					postTypePluralLabelCapitalized
				) }
			</EmptyState.Title>
			<EmptyState.Description>
				{ canCreateRecord
					? sprintf(
							// translators: %s: Post type singular label, e.g. "post", "page", or "product".
							__(
								'Create your first %s to start adding content here.'
							),
							postTypeSingularLabelCapitalized
					  )
					: sprintf(
							// translators: %s: Post type plural label, e.g. "posts", "pages", or "products".
							__( 'There are currently no %s to display.' ),
							postTypePluralLabelCapitalized
					  ) }
			</EmptyState.Description>
			{ labels?.add_new_item &&
				canCreateRecord &&
				postType !== 'attachment' && (
					<EmptyState.Actions>
						<ComponentsButton
							variant="primary"
							onClick={ openAddNewFlow }
							__next40pxDefaultSize
						>
							{ labels.add_new_item }
						</ComponentsButton>
					</EmptyState.Actions>
				) }
		</EmptyState.Root>
	) : undefined;

	return (
		<Page
			title={ postTypeObject.labels?.name }
			headingLevel={ 2 }
			subTitle={ postTypeObject.labels?.description }
			className={ `${ postTypeObject.name.toLowerCase() }-page` }
			actions={ postListActions }
			hasPadding={ false }
		>
			<div className="routes-post-list__tabs-wrapper">
				<Tabs.Root
					onValueChange={ handleContentTabChange }
					value={ activeContentTab }
				>
					<Tabs.List>
						<Tabs.Tab value="content">
							{ postTypeObject.labels?.name ||
								labels?.name ||
								postType }
						</Tabs.Tab>
						<Tabs.Tab value="templates">
							{ __( 'Templates' ) }
						</Tabs.Tab>
					</Tabs.List>
				</Tabs.Root>
			</div>
			{ activeContentTab === 'content' &&
				postType === 'page' &&
				homepageSettings.showOnFront === 'posts' && (
					<Notice
						className="routes-post-list__homepage-notice"
						status="info"
						isDismissible={ false }
					>
						{ __(
							'Your homepage is currently set to show your latest posts. WordPress generates that page automatically using the active homepage template.'
						) }
						<ComponentsButton
							variant="link"
							onClick={ () => setIsConfiguringHomepage( true ) }
						>
							{ __( 'Configure Homepage' ) }
						</ComponentsButton>
					</Notice>
				) }
			{ activeContentTab === 'templates' ? (
				<PostTypeTemplatesTab postType={ postType } />
			) : (
				<DataViews
					data={ displayedPosts || [] }
					fields={ fields }
					view={ dataView }
					onChangeView={ onChangeView }
					actions={ actions }
					isLoading={ isResolving || ! hasResolved }
					paginationInfo={ {
						totalItems: latestPostsTemplatePage
							? totalItems + 1
							: totalItems,
						totalPages:
							latestPostsTemplatePage && view.perPage
								? Math.ceil( ( totalItems + 1 ) / view.perPage )
								: totalPages,
					} }
					defaultLayouts={ DEFAULT_LAYOUTS }
					empty={ emptyState }
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
					renderItemLink={ ( {
						item,
						...props
					}: {
						item: PageListItem;
					} ) => (
						<Link
							to={
								item._isTemplatePage
									? `/types/wp_template/edit/${ encodeURIComponent(
											item.id
									  ) }`
									: `/types/${ postType }/edit/${ encodeURIComponent(
											item.id
									  ) }`
							}
							{ ...props }
							onClick={ ( event ) => {
								// Temporary fix to prevent triggering
								// onChangeSelection, which would override the URL.
								event.stopPropagation();
							} }
						/>
					) }
				>
					<PostListDataViewsLayout />
				</DataViews>
			) }
			{ postType === 'page' && isAddingPage && (
				<AddPageFlow onClose={ () => setIsAddingPage( false ) } />
			) }
			{ postType === 'page' && isConfiguringHomepage && (
				<ConfigureHomepageModal
					onClose={ closeConfigureHomepageModal }
					onSaved={ invalidate }
				/>
			) }
			{ searchParams.quickEdit &&
				! isResolving &&
				selection.length > 0 &&
				view.type !== LAYOUT_LIST && (
					<QuickEditModal
						postType={ postType }
						postId={ selection }
						closeModal={ closeQuickEditModal }
					/>
				) }
		</Page>
	);
}

export const stage = PostList;
