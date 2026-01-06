/**
 * WordPress dependencies
 */
import { NoticesDefaultList, NoticesSnackbarList } from '@wordpress/notices';

function Notices() {
	return (
		<>
			<NoticesDefaultList
				className="edit-widgets-notices__pinned"
				pinnedNoticesClassName="edit-widgets-notices__pinned"
				dismissibleNoticesClassName="edit-widgets-notices__dismissible"
			/>
			<NoticesSnackbarList className="edit-widgets-notices__snackbar" />
		</>
	);
}

export default Notices;
