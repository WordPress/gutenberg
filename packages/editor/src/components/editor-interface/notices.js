/**
 * WordPress dependencies
 */
import { InlineNotices } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';
import {
	DistributedEditingStatusChrome,
	DistributedEditingStatusInspector,
} from '../distributed-editing-status';

export default function EditorInterfaceNotices() {
	return (
		<InlineNotices
			pinnedNoticesClassName="editor-notices__pinned"
			dismissibleNoticesClassName="editor-notices__dismissible"
		>
			<TemplateValidationNotice />
			<DistributedEditingStatusChrome />
			{ shouldRenderDistributedEditingStatusInspector() && (
				<DistributedEditingStatusInspector />
			) }
		</InlineNotices>
	);
}

function shouldRenderDistributedEditingStatusInspector() {
	if (
		Boolean( globalThis?.__experimentalDistributedEditingStatusInspector )
	) {
		return true;
	}

	return isDistributedEditingStatusInspectorUrlFlagPresent();
}

function isDistributedEditingStatusInspectorUrlFlagPresent() {
	if ( ! globalThis?.location?.search ) {
		return false;
	}

	return (
		new URLSearchParams( globalThis.location.search ).get(
			'de-rtc-inspector'
		) === '1'
	);
}
