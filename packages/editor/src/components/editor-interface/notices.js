/**
 * WordPress dependencies
 */
import { InlineNotices } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';
import DistributedEditingStatus from '../distributed-editing-status';

export default function EditorInterfaceNotices() {
	return (
		<InlineNotices
			pinnedNoticesClassName="editor-notices__pinned"
			dismissibleNoticesClassName="editor-notices__dismissible"
		>
			<TemplateValidationNotice />
			<DistributedEditingStatus />
		</InlineNotices>
	);
}
