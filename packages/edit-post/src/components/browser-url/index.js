/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { store as editorStore } from '@wordpress/editor';

/**
 * Returns the Post's Edit URL.
 *
 * @param {number} postId Post ID.
 *
 * @return {string} Post edit URL.
 */
export function getPostEditURL( postId ) {
	return addQueryArgs( 'post.php', { post: postId, action: 'edit' } );
}

export default function BrowserURL() {
	const [ historyId, setHistoryId ] = useState( null );
	const { postId, postStatus, isTemplate } = useSelect( ( select ) => {
		const { getCurrentPost } = select( editorStore );
		const post = getCurrentPost();
		const { id, status, type } = post;

		return {
			postId: id,
			postStatus: status,
			isTemplate: [ 'wp_template', 'wp_template_part' ].includes( type ),
		};
	}, [] );

	useEffect( () => {
		if ( isTemplate ) {
			return;
		}

		if ( postId && postId !== historyId && postStatus !== 'auto-draft' ) {
			window.history.replaceState(
				{ id: postId },
				'Post ' + postId,
				getPostEditURL( postId )
			);
			setHistoryId( postId );
		}
	}, [ postId, postStatus, historyId, isTemplate ] );

	return null;
}
