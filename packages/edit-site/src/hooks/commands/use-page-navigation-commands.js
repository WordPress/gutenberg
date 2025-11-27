/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { page as pageIcon } from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

const getPageNavigationCommandLoader = () =>
	function usePageNavigationCommandLoader( { search } ) {
		const history = useHistory();

		const { currentPostType, pages, isLoading } = useSelect(
			( select ) => {
				const { getCurrentPostType } = select( editorStore );
				const postType = getCurrentPostType();

				// Only load pages when editing a page and no search query
				// (the existing search-based loader handles searches)
				if ( postType !== 'page' || search ) {
					return {
						currentPostType: postType,
						pages: [],
						isLoading: false,
					};
				}

				const query = {
					per_page: -1,
					status: 'publish',
					orderby: 'menu_order',
					order: 'asc',
				};

				return {
					currentPostType: postType,
					pages:
						select( coreStore ).getEntityRecords(
							'postType',
							'page',
							query
						) ?? [],
					isLoading: ! select( coreStore ).hasFinishedResolution(
						'getEntityRecords',
						[ 'postType', 'page', query ]
					),
				};
			},
			[ search ]
		);

		const commands = useMemo( () => {
			// Don't show commands if not editing a page or if searching
			if ( currentPostType !== 'page' || search ) {
				return [];
			}

			return pages.map( ( pageRecord ) => ( {
				name: 'core/edit-site/navigate-to-page-' + pageRecord.id,
				label: pageRecord.title?.rendered
					? decodeEntities( pageRecord.title.rendered )
					: __( '(no title)' ),
				icon: pageIcon,
				callback: ( { close } ) => {
					history.navigate( `/page/${ pageRecord.id }?canvas=edit` );
					close();
				},
			} ) );
		}, [ currentPostType, pages, history, search ] );

		return {
			commands,
			isLoading,
		};
	};

export function usePageNavigationCommands() {
	useCommandLoader( {
		name: 'core/edit-site/page-navigation',
		hook: getPageNavigationCommandLoader(),
		context: 'entity-edit', // Shows by default when in edit mode
	} );
}
