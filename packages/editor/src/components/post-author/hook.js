import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { AUTHORS_QUERY, BASE_QUERY } from './constants';

/**
 * Maps an author record to the `{ value, label }` shape the select works with.
 *
 * @param {Object} author The author record.
 *
 * @return {{value: string, label: string}} The select item.
 */
const authorToItem = ( author ) => ( {
	value: String( author.id ),
	label: decodeEntities( author.name ),
} );

/**
 * Queries the authors available for the post, optionally narrowed by a search
 * term.
 *
 * @param {string} [search] The term to search authors by.
 *
 * @return {{items: Object[], value: ?Object, isLoading: boolean}} The select
 * items, the currently selected item, and whether a query is in flight.
 */
export function useAuthorsQuery( search ) {
	const { authors, postAuthor, isLoading } = useSelect(
		( select ) => {
			const { getUser, getUsers, isResolving } = select( coreStore );
			const { getEditedPostAttribute } = select( editorStore );
			const _authorId = getEditedPostAttribute( 'author' );
			const query = { ...AUTHORS_QUERY };

			if ( search ) {
				query.search = search;
				query.search_columns = [ 'name' ];
			}

			return {
				authors: getUsers( query ),
				postAuthor: getUser( _authorId, BASE_QUERY ),
				isLoading: isResolving( 'getUsers', [ query ] ),
			};
		},
		[ search ]
	);

	const items = useMemo( () => {
		const fetchedAuthors = ( authors ?? [] ).map( authorToItem );

		// Ensure the current author is listed, unless these are search results,
		// where an author that does not match would be noise.
		if (
			! search &&
			postAuthor &&
			! fetchedAuthors.some(
				( { value } ) => value === String( postAuthor.id )
			)
		) {
			return [ authorToItem( postAuthor ), ...fetchedAuthors ];
		}

		return fetchedAuthors;
	}, [ authors, postAuthor, search ] );

	const value = useMemo(
		() => ( postAuthor ? authorToItem( postAuthor ) : null ),
		[ postAuthor ]
	);

	return { items, value, isLoading };
}
