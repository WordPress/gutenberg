/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useIsSiteEditorLoading } from './hooks';
import Editor from '../editor';
import PagePages from '../page-pages';
import PagePatterns from '../page-patterns';
import PageTemplates from '../page-templates';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SidebarNavigationScreenPatterns from '../sidebar-navigation-screen-patterns';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';
import DataViewsSidebarContent from '../sidebar-dataviews';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function useRedirectOldPaths() {
	const history = useHistory();
	const { params } = useLocation();
	useEffect( () => {
		const {
			postType,
			postId,
			path,
			layout,
			isCustom,
			canvas,
			categoryType,
			...rest
		} = params;

		if ( path === '/wp_template_part/all' ) {
			history.replace( { postType: 'template_part' } );
		}

		const allParamsButPath = {
			postId,
			layout,
			isCustom,
			canvas,
			...rest,
		};

		if ( path === '/page' ) {
			history.replace( {
				postType: 'page',
				...allParamsButPath,
			} );
		}

		if ( path === '/wp_template' ) {
			history.replace( {
				postType: 'wp_template',
				...allParamsButPath,
			} );
		}

		if ( path === '/patterns' ) {
			history.replace( {
				postType: categoryType ?? 'wp_block',
				...allParamsButPath,
			} );
		}

		if ( path === '/navigation' ) {
			history.replace( {
				postType: 'wp_navigation',
				...allParamsButPath,
			} );
		}
	}, [ history, params ] );
}

export default function useLayoutAreas() {
	const isSiteEditorLoading = useIsSiteEditorLoading();
	const history = useHistory();
	const { params } = useLocation();
	const { postType, postId, path, layout, isCustom, canvas } = params;
	useRedirectOldPaths();

	// Page list
	if ( postType === 'page' ) {
		const isListLayout = layout === 'list' || ! layout;
		return {
			key: 'pages',
			areas: {
				sidebar: (
					<SidebarNavigationScreen
						title={ __( 'Manage pages' ) }
						backPath={ {} }
						content={ <DataViewsSidebarContent /> }
					/>
				),
				content: <PagePages />,
				preview: ( isListLayout || canvas === 'edit' ) && (
					<Editor
						isLoading={ isSiteEditorLoading }
						onClick={ () =>
							history.push( {
								postType: 'page',
								postId,
								canvas: 'edit',
							} )
						}
					/>
				),
				mobile:
					canvas === 'edit' ? (
						<Editor isLoading={ isSiteEditorLoading } />
					) : (
						<PagePages />
					),
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Templates
	if ( postType === 'wp_template' ) {
		const isListLayout = isCustom !== 'true' && layout === 'list';
		return {
			key: 'templates',
			areas: {
				sidebar: (
					<SidebarNavigationScreenTemplatesBrowse backPath={ {} } />
				),
				content: <PageTemplates />,
				preview: ( isListLayout || canvas === 'edit' ) && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
				mobile: <PageTemplates />,
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Patterns
	if ( postType === 'wp_template_part' || postType === 'wp_block' ) {
		return {
			key: 'patterns',
			areas: {
				sidebar: <SidebarNavigationScreenPatterns backPath={ {} } />,
				content: <PagePatterns />,
				mobile: <PagePatterns />,
				preview: canvas === 'edit' && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
			},
		};
	}

	// Styles
	if ( path === '/wp_global_styles' ) {
		return {
			key: 'styles',
			areas: {
				sidebar: (
					<SidebarNavigationScreenGlobalStyles backPath={ {} } />
				),
				preview: <Editor isLoading={ isSiteEditorLoading } />,
				mobile: canvas === 'edit' && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
			},
		};
	}

	// Navigation
	if ( postType === 'wp_navigation' ) {
		if ( postId ) {
			return {
				key: 'navigation',
				areas: {
					sidebar: (
						<SidebarNavigationScreenNavigationMenu
							backPath={ { postType: 'wp_navigation' } }
						/>
					),
					preview: <Editor isLoading={ isSiteEditorLoading } />,
					mobile: canvas === 'edit' && (
						<Editor isLoading={ isSiteEditorLoading } />
					),
				},
			};
		}
		return {
			key: 'navigation',
			areas: {
				sidebar: (
					<SidebarNavigationScreenNavigationMenus backPath={ {} } />
				),
				preview: <Editor isLoading={ isSiteEditorLoading } />,
				mobile: canvas === 'edit' && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
			},
		};
	}

	// Fallback shows the home page preview
	return {
		key: 'default',
		areas: {
			sidebar: <SidebarNavigationScreenMain />,
			preview: <Editor isLoading={ isSiteEditorLoading } />,
			mobile: canvas === 'edit' && (
				<Editor isLoading={ isSiteEditorLoading } />
			),
		},
	};
}
