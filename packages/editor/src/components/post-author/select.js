/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { AUTHORS_QUERY } from './constants';

export default function PostAuthorSelect() {
	const { editPost } = useDispatch( editorStore );
	const { authorId, postAuthor, authors } = useSelect( ( select ) => {
		const { getUser, getUsers } = select( coreStore );
		const { getEditedPostAttribute } = select( editorStore );
		const _authorId = getEditedPostAttribute( 'author' );

		return {
			authorId: _authorId,
			authors: getUsers( AUTHORS_QUERY ),
			postAuthor: getUser( _authorId, {
				context: 'view',
			} ),
		};
	}, [] );

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

	const setAuthorId = ( value ) => {
		const author = Number( value );
		editPost( { author } );
	};

	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			className="post-author-selector"
			label={ __( 'Author' ) }
			options={ authorOptions }
			onChange={ setAuthorId }
			value={ authorId }
		/>
	);
}
