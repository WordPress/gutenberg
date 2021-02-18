/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { SelectControl } from '@wordpress/components';

function PostAuthorSelect() {
	const { editPost } = useDispatch( 'core/editor' );
	const { postAuthor, authors } = useSelect( ( select ) => {
		const authorsFromAPI = select( 'core' ).getAuthors();
		return {
			postAuthor: select( 'core/editor' ).getEditedPostAttribute(
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
