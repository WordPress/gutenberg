/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * This component checks the publishing status of the current post.
 * If the post is already published or the user doesn't have the
 * capability to publish, it returns null.
 *
 * @param {Object}  props          Component properties.
 * @param {Element} props.children Children to be rendered.
 *
 * @return {JSX.Element|null} The rendered child elements or null if the post is already published or the user doesn't have the capability to publish.
 */
export function PostPendingStatusCheck( { children } ) {
	const { hasPublishAction, isPublished } = useSelect( ( select ) => {
		const { isCurrentPostPublished, getCurrentPost } =
			select( editorStore );
		return {
			hasPublishAction:
				getCurrentPost()._links?.[ 'wp:action-publish' ] ?? false,
			isPublished: isCurrentPostPublished(),
		};
	}, [] );

	if ( isPublished || ! hasPublishAction ) {
		return null;
	}

	return children;
}

export default PostPendingStatusCheck;
