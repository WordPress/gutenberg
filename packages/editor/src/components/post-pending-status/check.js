/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostPendingStatusCheck( { children } ) {
	return usePostPendingStatusCheck() ? children : null;
}

export function usePostPendingStatusCheck() {
	return useSelect( ( select ) => {
		const isPublished = select( editorStore ).isCurrentPostPublished();
		const post = select( editorStore ).getCurrentPost();
		const hasPublishAction = !! post?._links?.[ 'wp:action-publish' ];
		return ! isPublished && hasPublishAction;
	}, [] );
}
