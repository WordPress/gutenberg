import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useUpdatePostLinkListener } from './listener-hooks';
import { unlock } from '../../lock-unlock';

const { useSyncAdminBarSiteIcon } = unlock( editorPrivateApis );

/**
 * Data component used for initializing the editor and re-initializes
 * when postId changes or on unmount.
 *
 * @return {null} This is a data component so does not render any ui.
 */
export default function EditorInitialization() {
	useUpdatePostLinkListener();
	useSyncAdminBarSiteIcon();
	return null;
}
