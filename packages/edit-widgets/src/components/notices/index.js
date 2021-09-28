/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { NoticeList, SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

function Notices() {
	const { removeNotice } = useDispatch( noticesStore );
	const { notices } = useSelect( ( select ) => {
		return {
			notices: select( noticesStore ).getNotices(),
		};
	}, [] );

	const dismissibleNotices = filter( notices, {
		isDismissible: true,
		type: 'default',
	} );
	const nonDismissibleNotices = filter( notices, {
		isDismissible: false,
		type: 'default',
	} );
	const snackbarNotices = filter( notices, {
		type: 'snackbar',
	} );

	return (
		<>
			<NoticeList
				notices={ nonDismissibleNotices }
				className="edit-widgets-notices__pinned"
			/>
			<NoticeList
				notices={ dismissibleNotices }
				className="edit-widgets-notices__dismissible"
				onRemove={ removeNotice }
			/>
			<SnackbarList
				notices={ snackbarNotices }
				className="edit-widgets-notices__snackbar"
				onRemove={ removeNotice }
			/>
		</>
	);
}

export default Notices;
