/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { InlineNotices } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';

/**
 * @deprecated since 7.0, use `wp.notices.InlineNotices` instead.
 */
export function EditorNotices() {
	deprecated( 'wp.editor.EditorNotices', {
		since: '7.0',
		version: '7.2',
		alternative: 'wp.notices.InlineNotices',
	} );

	const isValidTemplate = useSelect( ( select ) => {
		return select( blockEditorStore ).isValidTemplate();
	}, [] );

	return (
		<InlineNotices
			pinnedNoticesClassName="components-editor-notices__pinned"
			dismissibleNoticesClassName="components-editor-notices__dismissible"
		>
			{ ! isValidTemplate && <TemplateValidationNotice /> }
		</InlineNotices>
	);
}

export default EditorNotices;
