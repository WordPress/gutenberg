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

	const dismissibleNotices = notices.filter(
		( { isDismissible, type } ) => isDismissible && type === 'default'
	);
	const nonDismissibleNotices = notices.filter(
		( { isDismissible, type } ) => ! isDismissible && type === 'default'
	);
	const snackbarNotices = notices.filter(
		( { type } ) => type === 'snackbar'
	);

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
				maxVisible={ 3 }
				className="edit-widgets-notices__snackbar"
				onRemove={ removeNotice }
			/>
		</>
	);
}

export default Notices;
