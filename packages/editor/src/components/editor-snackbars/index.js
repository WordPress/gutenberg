/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { SnackbarNotices } from '@wordpress/notices';

/**
 * Renders the editor snackbars component.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function EditorSnackbars() {
	deprecated( 'wp.editor.EditorSnackbars', {
		since: '7.0',
		version: '7.2',
		alternative: 'wp.notices.SnackbarNotices',
	} );

	return <SnackbarNotices className="components-editor-notices__snackbar" />;
}
