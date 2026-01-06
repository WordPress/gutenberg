/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { NoticesSnackbarList } from '@wordpress/notices';

/**
 * Renders the editor snackbars component.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function EditorSnackbars() {
	deprecated( 'wp.editor.EditorSnackbars', {
		since: '6.7',
		version: '6.9',
		alternative: 'wp.notices.NoticesSnackbarList',
	} );

	return (
		<NoticesSnackbarList className="components-editor-notices__snackbar" />
	);
}
