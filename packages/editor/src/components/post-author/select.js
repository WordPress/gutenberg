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

function PostAuthorSelect() {
	const { editPost } = useDispatch( editorStore );
	const { postAuthorId, authors } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { getUser, getUsers } = select( coreStore );
		const _authors = getUsers( AUTHORS_QUERY ) ?? [];
		const _postAuthorId = getEditedPostAttribute( 'author' );
		const postAuthor = _postAuthorId ? getUser( _postAuthorId ) : null;

		// If the author of the post does not have a post role, include
		// in the author list to prevent unintentional author updates.
		if (
			_postAuthorId &&
			postAuthor &&
			! _authors.find( ( { id } ) => id === postAuthorId )
		) {
			_authors.push( postAuthor );
		}

		return {
			postAuthorId: _postAuthorId,
			authors: _authors,
		};
	}, [] );

	const authorOptions = useMemo( () => {
		return authors.map( ( author ) => {
			return {
				value: author.id,
				label: decodeEntities( author.name ),
			};
		} );
	}, [ authors ] );

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
			value={ postAuthorId }
		/>
	);
}

export default PostAuthorSelect;
