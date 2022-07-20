/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanelItem } from '@wordpress/components';
import {
	PostPendingStatus as PostPendingStatusForm,
	PostPendingStatusCheck,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export function PostPendingStatus() {
	return (
		<PostPendingStatusCheck>
			<ToolsPanelItem
				label={ __( 'Pending review' ) }
				hasValue={ () => true }
			>
				<PostPendingStatusForm />
			</ToolsPanelItem>
		</PostPendingStatusCheck>
	);
}

export default PostPendingStatus;
