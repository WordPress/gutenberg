/**
 * WordPress dependencies
 */
import {
	PostPendingStatus as PostPendingStatusForm,
	PostPendingStatusCheck,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { PostPanelRow } = unlock( editorPrivateApis );

export function PostPendingStatus() {
	return (
		<PostPendingStatusCheck>
			<PostPanelRow>
				<PostPendingStatusForm />
			</PostPanelRow>
		</PostPendingStatusCheck>
	);
}

export default PostPendingStatus;
