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
	const { postAuthor, authors } = useSelect( ( select ) => {
		return {
			postAuthor:
				select( editorStore ).getEditedPostAttribute( 'author' ),
			authors: select( coreStore ).getUsers( AUTHORS_QUERY ),
		};
	}, [] );

	const authorOptions = useMemo( () => {
		return ( authors ?? [] ).map( ( author ) => {
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
			__nextHasNoMarginBottom
			className="post-author-selector"
			label={ __( 'Author' ) }
			options={ authorOptions }
			onChange={ setAuthorId }
			value={ postAuthor }
		/>
	);
}

export default PostAuthorSelect;
