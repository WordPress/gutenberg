/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';
import { useHistory } from '../../components/routes';

const { useCommandLoader } = unlock( privateApis );

const getNavigationCommandLoaderPerPostType = ( postType ) =>
	function useNavigationCommandLoader( { search } ) {
		const supportsSearch = ! [ 'wp_template', 'wp_template_part' ].includes(
			postType
		);
		const deps = supportsSearch ? [ search ] : [];
		const history = useHistory();
		const { canvasMode, records, isLoading } = useSelect( ( select ) => {
			const { getEntityRecords } = select( coreStore );
			const query = supportsSearch
				? {
						search: !! search ? search : undefined,
						per_page: 10,
						orderby: search ? 'relevance' : 'date',
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
				canvasMode: unlock( select( editSiteStore ) ).getCanvasMode(),
			};
		}, deps );

		const commands = useMemo( () => {
			return ( records ?? [] ).slice( 0, 10 ).map( ( record ) => {
				return {
					name: record.title?.rendered + ' ' + record.id,
					label: record.title?.rendered
						? record.title?.rendered
						: __( '(no title)' ),
					callback: ( { close } ) => {
						history.push( {
							postType,
							postId: record.id,
							canvas:
								canvasMode === 'edit' ? canvasMode : undefined,
						} );
						close();
					},
				};
			} );
		}, [ records, history, canvasMode ] );

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

export function useNavigationCommands() {
	useCommandLoader( {
		name: 'core/edit-site/navigate-pages',
		group: __( 'Pages' ),
		hook: usePageNavigationCommandLoader,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-posts',
		group: __( 'Posts' ),
		hook: usePostNavigationCommandLoader,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-templates',
		group: __( 'Templates' ),
		hook: useTemplateNavigationCommandLoader,
	} );
	useCommandLoader( {
		name: 'core/edit-site/navigate-template-parts',
		group: __( 'Template Parts' ),
		hook: useTemplatePartNavigationCommandLoader,
	} );
}
