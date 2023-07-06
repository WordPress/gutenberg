/**
 * WordPress dependencies
 */
import { useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	post,
	page,
	layout,
	symbolFilled,
	styles,
	navigation,
} from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { getQueryArg, addQueryArgs, getPath } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

const icons = {
	post,
	page,
	wp_template: layout,
	wp_template_part: symbolFilled,
};

const getNavigationCommandLoaderPerPostType = ( postType ) =>
	function useNavigationCommandLoader( { search } ) {
		const history = useHistory();
		const supportsSearch = ! [ 'wp_template', 'wp_template_part' ].includes(
			postType
		);
		const { records, isLoading } = useSelect(
			( select ) => {
				const { getEntityRecords } = select( coreStore );
				const query = supportsSearch
					? {
							search: !! search ? search : undefined,
							per_page: 10,
							orderby: search ? 'relevance' : 'date',
							status: [
								'publish',
								'future',
								'draft',
								'pending',
								'private',
							],
					  }
					: {
							per_page: -1,
					  };
				return {
					records: getEntityRecords( 'postType', postType, query ),
					isLoading: ! select( coreStore ).hasFinishedResolution(
						'getEntityRecords',
						[ 'postType', postType, query ]
					),
				};
			},
			[ supportsSearch, search ]
		);

		const commands = useMemo( () => {
			return ( records ?? [] ).slice( 0, 10 ).map( ( record ) => {
				const isSiteEditor = getPath( window.location.href )?.includes(
					'site-editor.php'
				);
				const extraArgs = isSiteEditor
					? { canvas: getQueryArg( window.location.href, 'canvas' ) }
					: {};
				return {
					name: postType + '-' + record.id,
					searchLabel: record.title?.rendered + ' ' + record.id,
					label: record.title?.rendered
						? record.title?.rendered
						: __( '(no title)' ),
					icon: icons[ postType ],
					callback: ( { close } ) => {
						const args = {
							postType,
							postId: record.id,
							...extraArgs,
						};
						const targetUrl = addQueryArgs(
							'site-editor.php',
							args
						);
						if ( isSiteEditor ) {
							history.push( args );
						} else {
							document.location = targetUrl;
						}
						close();
					},
				};
			} );
		}, [ records, history ] );

		return {
			commands,
			isLoading,
		};
	};

const usePageNavigationCommandLoader =
	getNavigationCommandLoaderPerPostType( 'page' );
const usePostNavigationCommandLoader =
	getNavigationCommandLoaderPerPostType( 'post' );
const useTemplateNavigationCommandLoader =
	getNavigationCommandLoaderPerPostType( 'wp_template' );
const useTemplatePartNavigationCommandLoader =
	getNavigationCommandLoaderPerPostType( 'wp_template_part' );

function useSiteEditorBasicNavigationCommands() {
	const history = useHistory();
	const isSiteEditor = getPath( window.location.href )?.includes(
		'site-editor.php'
	);
	const commands = useMemo( () => {
		const result = [];
		result.push( {
			name: 'core/edit-site/open-navigation',
			label: __( 'Open navigation' ),
			icon: navigation,
			callback: ( { close } ) => {
				const args = {
					path: '/navigation',
				};
				const targetUrl = addQueryArgs( 'site-editor.php', args );
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = targetUrl;
				}
				close();
			},
		} );

		result.push( {
			name: 'core/edit-site/open-pages',
			label: __( 'Open pages' ),
			icon: page,
			callback: ( { close } ) => {
				const args = {
					path: '/page',
				};
				const targetUrl = addQueryArgs( 'site-editor.php', args );
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = targetUrl;
				}
				close();
			},
		} );

		result.push( {
			name: 'core/edit-site/open-style-variations',
			label: __( 'Open style variations' ),
			icon: styles,
			callback: ( { close } ) => {
				const args = {
					path: '/wp_global_styles',
				};
				const targetUrl = addQueryArgs( 'site-editor.php', args );
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = targetUrl;
				}
				close();
			},
		} );

		result.push( {
			name: 'core/edit-site/open-templates',
			label: __( 'Open templates' ),
			icon: layout,
			callback: ( { close } ) => {
				const args = {
					path: '/wp_template',
				};
				const targetUrl = addQueryArgs( 'site-editor.php', args );
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = targetUrl;
				}
				close();
			},
		} );

		result.push( {
			name: 'core/edit-site/open-template-parts',
			label: __( 'Open library' ),
			icon: symbolFilled,
			callback: ( { close } ) => {
				const args = {
					path: '/patterns',
				};
				const targetUrl = addQueryArgs( 'site-editor.php', args );
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = targetUrl;
				}
				close();
			},
		} );
		return result;
	}, [ history, isSiteEditor ] );

	return {
		commands,
		isLoading: false,
	};
}

export function useSiteEditorNavigationCommands() {
	useCommandLoader( {
		name: 'core/edit-site/navigate-pages',
		hook: usePageNavigationCommandLoader,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-posts',
		hook: usePostNavigationCommandLoader,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-templates',
		hook: useTemplateNavigationCommandLoader,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-template-parts',
		hook: useTemplatePartNavigationCommandLoader,
	} );
	useCommandLoader( {
		name: 'core/edit-site/basic-navigation',
		hook: useSiteEditorBasicNavigationCommands,
		context: 'site-editor',
	} );
}
