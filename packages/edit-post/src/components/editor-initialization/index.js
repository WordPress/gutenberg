/**
 * Internal dependencies
 */
import { useUpdatePostLinkListener } from './listener-hooks';

/**
 * Data component used for initializing the editor and re-initializes
 * when postId changes or on unmount.
 *
 * @return {null} This is a data component so does not render any ui.
 */
export default function EditorInitialization() {
	useUpdatePostLinkListener();
	return null;
}
