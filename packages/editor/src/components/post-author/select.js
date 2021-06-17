/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostAuthorSelect() {
	const { editPost } = useDispatch( editorStore );
	const { postAuthor, authors } = useSelect( ( select ) => {
		const authorsFromAPI = select( coreStore ).getAuthors();
		return {
			postAuthor: select( editorStore ).getEditedPostAttribute(
				'author'
			),
			authors: authorsFromAPI.map( ( author ) => ( {
				label: decodeEntities( author.name ),
				value: author.id,
			} ) ),
		};
	}, [] );

	const setAuthorId = ( value ) => {
		const author = Number( value );
		editPost( { author } );
	};

	return (
		<SelectControl
			className="post-author-selector"
			label={ __( 'Author' ) }
			options={ authors }
			onChange={ setAuthorId }
			value={ postAuthor }
		/>
	);
}

export default PostAuthorSelect;
