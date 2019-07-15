/**
 * Internal dependencies
 */
import {
	useAdjustSidebarListener,
	useBlockSelectionListener,
	useUpdatePostLinkListener,
} from './listener-hooks';

/**
 * Data component used for initializing the editor and re-initializes
 * when postId changes or on unmount.
 *
 * @param {number} postId  The id of the post.
 * @return {null} This is a data component so does not render any ui.
 */
export default function( { postId } ) {
	useAdjustSidebarListener( postId );
	useBlockSelectionListener( postId );
	useUpdatePostLinkListener( postId );
	return null;
}
