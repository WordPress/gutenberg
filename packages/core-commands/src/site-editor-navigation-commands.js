/**
 * WordPress dependencies
 */
import { useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { useMemo, useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	post,
	page,
	layout,
	symbol,
	symbolFilled,
	styles,
	navigation,
	brush,
} from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs, getPath } from '@wordpress/url';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { orderEntityRecordsBySearch } from './utils/order-entity-records-by-search';

const { useHistory } = unlock( routerPrivateApis );

const icons = {
	post,
	page,
	wp_template: layout,
	wp_template_part: symbolFilled,
};

function useDebouncedValue( value ) {
	const [ debouncedValue, setDebouncedValue ] = useState( '' );
	const debounced = useDebounce( setDebouncedValue, 250 );

	useEffect( () => {
		debounced( value );
		return () => debounced.cancel();
	}, [ debounced, value ] );

	return debouncedValue;
}

// Route mapping for experimental site editor
const ROUTE_MAPPING = {
	'/template': '/templates',
	'/pattern': '/patterns',
};

// Helper to determine the site editor page URL
function getSiteEditorPage() {
	return window.__experimentalExtensibleSiteEditor
		? 'admin.php?page=site-editor-v2'
		: 'site-editor.php';
}

// Helper to map routes for experimental site editor
function mapRoute( path ) {
	if ( ! window.__experimentalExtensibleSiteEditor ) {
		return path;
	}

	// Check if path needs mapping
	for ( const [ oldPath, newPath ] of Object.entries( ROUTE_MAPPING ) ) {
		if ( path === oldPath || path.startsWith( oldPath + '?' ) ) {
			// Handle template parts special case
			if ( path.includes( 'postType=wp_template_part' ) ) {
				return '/template-parts';
			}
			// Replace the base path
			return path.replace( oldPath, newPath );
		}
	}

	return path;
}

// Helper to check if currently in site editor
function isInSiteEditor() {
	const path = getPath( window.location.href );
	return (
		path?.includes( 'site-editor.php' ) ||
		path?.includes( 'page=site-editor-v2' )
	);
}

const getNavigationCommandLoaderPerPostType = ( postType ) =>
	function useNavigationCommandLoader( { search } ) {
		const history = useHistory();
		const { isBlockBasedTheme, canCreateTemplate } = useSelect(
			( select ) => {
				return {
					isBlockBasedTheme:
						select( coreStore ).getCurrentTheme()?.is_block_theme,
					canCreateTemplate: select( coreStore ).canUser( 'create', {
						kind: 'postType',
						name: 'wp_template',
					} ),
				};
			},
			[]
		);
		const delayedSearch = useDebouncedValue( search );
		const { records, isLoading } = useSelect(
			( select ) => {
				if ( ! delayedSearch ) {
					return {
						isLoading: false,
					};
				}

				const query = {
					search: delayedSearch,
					per_page: 10,
					orderby: 'relevance',
					status: [
						'publish',
						'future',
						'draft',
						'pending',
						'private',
					],
				};
				return {
					records: select( coreStore ).getEntityRecords(
						'postType',
						postType,
						query
					),
					isLoading: ! select( coreStore ).hasFinishedResolution(
						'getEntityRecords',
						[ 'postType', postType, query ]
					),
				};
			},
			[ delayedSearch ]
		);

		const commands = useMemo( () => {
			return ( records ?? [] ).map( ( record ) => {
				const command = {
					name: postType + '-' + record.id,
					searchLabel: record.title?.rendered + ' ' + record.id,
					label: record.title?.rendered
						? decodeEntities( record.title?.rendered )
						: __( '(no title)' ),
					icon: icons[ postType ],
				};

				if (
					! canCreateTemplate ||
					postType === 'post' ||
					( postType === 'page' && ! isBlockBasedTheme )
				) {
					return {
						...command,
						callback: ( { close } ) => {
							const args = {
								post: record.id,
								action: 'edit',
							};
							const targetUrl = addQueryArgs( 'post.php', args );
							document.location = targetUrl;
							close();
						},
					};
				}

				const isSiteEditor = isInSiteEditor();

				return {
					...command,
					callback: ( { close } ) => {
						if ( isSiteEditor ) {
							history.navigate(
								`/${ postType }/${ record.id }?canvas=edit`
							);
						} else {
							document.location = addQueryArgs(
								getSiteEditorPage(),
								{
									p: `/${ postType }/${ record.id }`,
									canvas: 'edit',
								}
							);
						}
						close();
					},
				};
			} );
		}, [ canCreateTemplate, records, isBlockBasedTheme, history ] );

		return {
			commands,
			isLoading,
		};
	};

const getNavigationCommandLoaderPerTemplate = ( templateType ) =>
	function useNavigationCommandLoader( { search } ) {
		const history = useHistory();
		const { isBlockBasedTheme, canCreateTemplate } = useSelect(
			( select ) => {
				return {
					isBlockBasedTheme:
						select( coreStore ).getCurrentTheme()?.is_block_theme,
					canCreateTemplate: select( coreStore ).canUser( 'create', {
						kind: 'postType',
						name: templateType,
					} ),
				};
			},
			[]
		);
		const { records, isLoading } = useSelect( ( select ) => {
			const { getEntityRecords } = select( coreStore );
			const query = { per_page: -1 };
			return {
				records: getEntityRecords( 'postType', templateType, query ),
				isLoading: ! select( coreStore ).hasFinishedResolution(
					'getEntityRecords',
					[ 'postType', templateType, query ]
				),
			};
		}, [] );

		/*
		 * wp_template and wp_template_part endpoints do not support per_page or orderby parameters.
		 * We need to sort the results based on the search query to avoid removing relevant
		 * records below using .slice().
		 */
		const orderedRecords = useMemo( () => {
			return orderEntityRecordsBySearch( records, search ).slice( 0, 10 );
		}, [ records, search ] );

		const commands = useMemo( () => {
			if (
				! canCreateTemplate ||
				( ! isBlockBasedTheme && ! templateType === 'wp_template_part' )
			) {
				return [];
			}
			const isSiteEditor = getPath( window.location.href )?.includes(
				'site-editor.php'
			);
			const result = [];
			result.push(
				...orderedRecords.map( ( record ) => {
					return {
						name: templateType + '-' + record.id,
						searchLabel: record.title?.rendered + ' ' + record.id,
						label: record.title?.rendered
							? record.title?.rendered
							: __( '(no title)' ),
						icon: icons[ templateType ],
						callback: ( { close } ) => {
							if ( isSiteEditor ) {
								history.navigate(
									`/${ templateType }/${ record.id }?canvas=edit`
								);
							} else {
								document.location = addQueryArgs(
									getSiteEditorPage(),
									{
										p: `/${ templateType }/${ record.id }`,
										canvas: 'edit',
									}
								);
							}
							close();
						},
					};
				} )
			);

			if (
				orderedRecords?.length > 0 &&
				templateType === 'wp_template_part'
			) {
				result.push( {
					name: 'core/edit-site/open-template-parts',
					label: __( 'Go to: Template parts' ),
					icon: symbolFilled,
					callback: ( { close } ) => {
						if ( isSiteEditor ) {
							history.navigate(
								mapRoute(
									'/pattern?postType=wp_template_part&categoryId=all-parts'
								)
							);
						} else {
							document.location = addQueryArgs(
								getSiteEditorPage(),
								{
									p: mapRoute( '/pattern' ),
									postType: 'wp_template_part',
									categoryId: 'all-parts',
								}
							);
						}
						close();
					},
				} );
			}
			return result;
		}, [ canCreateTemplate, isBlockBasedTheme, orderedRecords, history ] );

		return {
			commands,
			isLoading,
		};
	};

const getSiteEditorBasicNavigationCommands = () =>
	function useSiteEditorBasicNavigationCommands() {
		const history = useHistory();
		const isSiteEditor = isInSiteEditor();
		const { isBlockBasedTheme, canCreateTemplate, canCreatePatterns } =
			useSelect( ( select ) => {
				return {
					isBlockBasedTheme:
						select( coreStore ).getCurrentTheme()?.is_block_theme,
					canCreateTemplate: select( coreStore ).canUser( 'create', {
						kind: 'postType',
						name: 'wp_template',
					} ),
					canCreatePatterns: select( coreStore ).canUser( 'create', {
						kind: 'postType',
						name: 'wp_block',
					} ),
				};
			}, [] );
		const commands = useMemo( () => {
			const result = [];

			if ( canCreateTemplate && isBlockBasedTheme ) {
				// Go to Styles command
				result.push( {
					name: 'core/edit-site/open-styles',
					label: __( 'Go to: Styles' ),
					icon: styles,
					callback: ( { close } ) => {
						if ( isSiteEditor ) {
							history.navigate( '/styles' );
						} else {
							document.location = addQueryArgs(
								getSiteEditorPage(),
								{
									p: '/styles',
								}
							);
						}
						close();
					},
				} );

				result.push( {
					name: 'core/edit-site/open-navigation',
					label: __( 'Go to: Navigation' ),
					icon: navigation,
					callback: ( { close } ) => {
						if ( isSiteEditor ) {
							history.navigate( '/navigation' );
						} else {
							document.location = addQueryArgs(
								getSiteEditorPage(),
								{
									p: '/navigation',
								}
							);
						}
						close();
					},
				} );

				result.push( {
					name: 'core/edit-site/open-templates',
					label: __( 'Go to: Templates' ),
					icon: layout,
					callback: ( { close } ) => {
						if ( isSiteEditor ) {
							history.navigate( mapRoute( '/template' ) );
						} else {
							document.location = addQueryArgs(
								getSiteEditorPage(),
								{
									p: mapRoute( '/template' ),
								}
							);
						}
						close();
					},
				} );
			}

			if ( canCreatePatterns ) {
				result.push( {
					name: 'core/edit-site/open-patterns',
					label: __( 'Go to: Patterns' ),
					icon: symbol,
					callback: ( { close } ) => {
						if ( canCreateTemplate ) {
							if ( isSiteEditor ) {
								history.navigate( mapRoute( '/pattern' ) );
							} else {
								document.location = addQueryArgs(
									getSiteEditorPage(),
									{
										p: mapRoute( '/pattern' ),
									}
								);
							}
							close();
						} else {
							// If a user cannot access the site editor.
							document.location.href =
								'edit.php?post_type=wp_block';
						}
					},
				} );
			}

			return result;
		}, [
			history,
			isSiteEditor,
			canCreateTemplate,
			canCreatePatterns,
			isBlockBasedTheme,
		] );

		return {
			commands,
			isLoading: false,
		};
	};

const getGlobalStylesOpenCssCommands = () =>
	function useGlobalStylesOpenCssCommands() {
		const history = useHistory();
		const isSiteEditor = isInSiteEditor();
		const { canEditCSS } = useSelect( ( select ) => {
			const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
				select( coreStore );

			const globalStylesId = __experimentalGetCurrentGlobalStylesId();
			const globalStyles = globalStylesId
				? getEntityRecord( 'root', 'globalStyles', globalStylesId )
				: undefined;

			return {
				canEditCSS: !! globalStyles?._links?.[ 'wp:action-edit-css' ],
			};
		}, [] );

		const commands = useMemo( () => {
			if ( ! canEditCSS ) {
				return [];
			}

			return [
				{
					name: 'core/open-styles-css',
					label: __( 'Open custom CSS' ),
					icon: brush,
					callback: ( { close } ) => {
						close();

						if ( isSiteEditor ) {
							history.navigate( '/styles?section=/css' );
						} else {
							document.location = addQueryArgs(
								getSiteEditorPage(),
								{
									p: '/styles',
									section: '/css',
								}
							);
						}
					},
				},
			];
		}, [ history, canEditCSS, isSiteEditor ] );

		return {
			isLoading: false,
			commands,
		};
	};

export function useSiteEditorNavigationCommands( isNetworkAdmin ) {
	useCommandLoader( {
		name: 'core/edit-site/navigate-pages',
		hook: getNavigationCommandLoaderPerPostType( 'page' ),
		disabled: isNetworkAdmin,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-posts',
		hook: getNavigationCommandLoaderPerPostType( 'post' ),
		disabled: isNetworkAdmin,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-templates',
		hook: getNavigationCommandLoaderPerTemplate( 'wp_template' ),
		disabled: isNetworkAdmin,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-template-parts',
		hook: getNavigationCommandLoaderPerTemplate( 'wp_template_part' ),
		disabled: isNetworkAdmin,
	} );
	useCommandLoader( {
		name: 'core/edit-site/basic-navigation',
		hook: getSiteEditorBasicNavigationCommands(),
		context: 'site-editor',
		disabled: isNetworkAdmin,
	} );
	useCommandLoader( {
		name: 'core/edit-site/global-styles-css',
		hook: getGlobalStylesOpenCssCommands(),
		disabled: isNetworkAdmin,
	} );
}
