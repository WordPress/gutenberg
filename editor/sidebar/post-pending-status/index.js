/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostPendingStatusCheck from '../../post-pending-status/check';
import PostPendingStatusForm from '../../post-pending-status';

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
