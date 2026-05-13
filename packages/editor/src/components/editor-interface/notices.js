/**
 * WordPress dependencies
 */
import { InlineNotices } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';
import DistributedEditingStatus, {
	DistributedEditingStatusInspector,
} from '../distributed-editing-status';

export default function EditorInterfaceNotices() {
	return (
		<InlineNotices
			pinnedNoticesClassName="editor-notices__pinned"
			dismissibleNoticesClassName="editor-notices__dismissible"
		>
			<TemplateValidationNotice />
			<DistributedEditingStatus />
			{ shouldRenderDistributedEditingStatusInspector() && (
				<DistributedEditingStatusInspector />
			) }
		</InlineNotices>
	);
}

function shouldRenderDistributedEditingStatusInspector() {
	return Boolean(
		globalThis?.__experimentalDistributedEditingStatusInspector
	);
}
