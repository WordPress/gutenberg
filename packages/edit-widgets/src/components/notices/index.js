/**
 * WordPress dependencies
 */
import { InlineNotices, SnackbarNotices } from '@wordpress/notices';

function Notices() {
	return (
		<>
			<InlineNotices
				pinnedNoticesClassName="edit-widgets-notices__pinned"
				dismissibleNoticesClassName="edit-widgets-notices__dismissible"
			/>
			<SnackbarNotices className="edit-widgets-notices__snackbar" />
		</>
	);
}

export default Notices;
