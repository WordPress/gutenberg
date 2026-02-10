/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { InlineNotices } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';

/**
 * This component renders the notices displayed in the editor. It displays pinned notices first, followed by dismissible
 *
 * @example
 * ```jsx
 * <EditorNotices />
 * ```
 *
 * @return {React.ReactNode} The rendered EditorNotices component.
 */
export function EditorNotices() {
	deprecated( 'wp.editor.EditorNotices', {
		since: '7.0',
		version: '7.2',
		alternative: 'wp.notices.InlineNotices',
	} );

	return (
		<InlineNotices
			pinnedNoticesClassName="components-editor-notices__pinned"
			dismissibleNoticesClassName="components-editor-notices__dismissible"
		>
			<TemplateValidationNotice />
		</InlineNotices>
	);
}

export default EditorNotices;
