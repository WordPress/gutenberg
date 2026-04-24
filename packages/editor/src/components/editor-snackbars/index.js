/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { SnackbarNotices } from '@wordpress/notices';

/**
 * @deprecated since 7.0, use `wp.notices.SnackbarNotices` instead.
 */
export default function EditorSnackbars() {
	deprecated( 'wp.editor.EditorSnackbars', {
		since: '7.0',
		version: '7.2',
		alternative: 'wp.notices.SnackbarNotices',
	} );

	return <SnackbarNotices className="components-editor-notices__snackbar" />;
}
