/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PostPendingStatus as PostPendingStatusForm, PostPendingStatusCheck } from '../../components';

export function PostPendingStatus() {
	return (
		<PostPendingStatusCheck>
			<PanelRow>
				<PostPendingStatusForm />
			</PanelRow>
		</PostPendingStatusCheck>
	);
}

export default PostPendingStatus;
