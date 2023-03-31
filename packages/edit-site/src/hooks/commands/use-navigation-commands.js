/**
 * WordPress dependencies
 */
import { useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useHistory } from '../../components/routes';

const getNavigationCommandLoaderPerPostType = ( postType ) =>
	function useNavigationCommandLoader( { search } ) {
		const supportsSearch = ! [ 'wp_template', 'wp_template_part' ].includes(
			postType
		);
		const deps = supportsSearch ? [ search ] : [];
		const history = useHistory();
		const { records, isLoading } = useSelect( ( select ) => {
			const { getEntityRecords } = select( coreStore );
			const query = supportsSearch
				? {
						search,
						per_page: 20,
						orderby: 'date',
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
		}, deps );

		const commands = useMemo( () => {
			return ( records ?? [] ).map( ( record ) => {
				return {
					name: record.title?.rendered + ' ' + record.id,
					label: record.title?.rendered,
					callback: ( { close } ) => {
						history.push( {
							postType,
							postId: record.id,
						} );
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
