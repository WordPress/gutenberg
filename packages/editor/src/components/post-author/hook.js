/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { AUTHORS_QUERY, BASE_QUERY } from './constants';

export function useAuthorsQuery( search ) {
	const { authorId, authors, postAuthor } = useSelect(
		( select ) => {
			const { getUser, getUsers } = select( coreStore );
			const { getEditedPostAttribute } = select( editorStore );
			const _authorId = getEditedPostAttribute( 'author' );
			const query = { ...AUTHORS_QUERY };

			if ( search ) {
				query.search = search;
			}

			return {
				authorId: _authorId,
				authors: getUsers( query ),
				postAuthor: getUser( _authorId, BASE_QUERY ),
			};
		},
		[ search ]
	);

	const authorOptions = useMemo( () => {
		const fetchedAuthors = ( authors ?? [] ).map( ( author ) => {
			return {
				value: author.id,
				label: decodeEntities( author.name ),
			};
		} );

		// Ensure the current author is included in the dropdown list.
		const foundAuthor = fetchedAuthors.findIndex(
			( { value } ) => postAuthor?.id === value
		);

		if ( foundAuthor < 0 && postAuthor ) {
			return [
				{
					value: postAuthor.id,
					label: decodeEntities( postAuthor.name ),
				},
				...fetchedAuthors,
			];
		}

		return fetchedAuthors;
	}, [ authors, postAuthor ] );

	return { authorId, authorOptions, postAuthor };
}
