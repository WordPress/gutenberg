/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { CustomSelectControl } from '@wordpress/components';
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
			postAuthor: select( editorStore ).getEditedPostAttribute(
				'author'
			),
			authors: select( coreStore ).getUsers( AUTHORS_QUERY ),
		};
	}, [] );

	const authorOptions = useMemo( () => {
		return ( authors ?? [] ).map( ( author ) => {
			const [ avatarSize, avatarURL ] = Object.entries(
				author.avatar_urls
			).find( ( [ size ] ) => size >= 26 * 2 );
			return {
				key: author.id,
				name: decodeEntities( author.name ),
				__experimentalImage: {
					src: avatarURL,
					width: avatarSize / 2,
					height: avatarSize / 2,
				},
			};
		} );
	}, [ authors ] );

	const setAuthorId = ( option ) => {
		const author = Number( option.key );
		editPost( { author } );
	};

	return (
		<CustomSelectControl
			className="editor-post-author-select"
			label={ __( 'Author' ) }
			options={ authorOptions }
			onChange={ setAuthorId }
			value={ authorOptions.find( ( { key } ) => key === postAuthor ) }
			__next36pxDefaultSize
		/>
	);
}

export default PostAuthorSelect;
