/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

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
