/**
 * WordPress dependencies
 */
import { useCommand, useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useHistory } from '../../components/routes';

function useNavigationCommandLoader( { search } ) {
	const history = useHistory();
	const { pages, isLoading } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const query = {
				search,
				per_page: 20,
				orderby: 'date',
			};
			return {
				pages: getEntityRecords( 'postType', 'page', query ),
				isLoading: ! select( coreStore ).hasFinishedResolution(
					'getEntityRecords',
					[ 'postType', 'page', query ]
				),
			};
		},
		[ search ]
	);

	const commands = useMemo( () => {
		return ( pages ?? [] ).map( ( page ) => {
			return {
				name: page.title?.rendered + ' ' + page.id,
				label: page.title?.rendered,
				callback: () => {
					history.push( {
						postType: 'page',
						postId: page.id,
					} );
				},
			};
		} );
	}, [ pages, history ] );

	return {
		commands,
		isLoading,
	};
}

export function useNavigationCommands() {
	useCommand( {
		name: 'core/edit-site/navigate',
		label: __( 'Navigate to a page' ),
		callback: ( { navigateToPage } ) => {
			navigateToPage( 'core/edit-site/navigate' );
		},
	} );

	useCommandLoader( {
		page: 'core/edit-site/navigate',
		hook: useNavigationCommandLoader,
		placeholder: __( 'Search for a page…' ),
	} );
}
