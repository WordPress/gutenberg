/**
 * WordPress dependencies
 */
import { NoticeList, SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

export default function EditNavigationNotices() {
	const { removeNotice } = useDispatch( noticesStore );
	const notices = useSelect(
		( select ) => select( noticesStore ).getNotices(),
		[]
	);
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
				className="edit-navigation-notices__notice-list"
			/>
			<NoticeList
				notices={ dismissibleNotices }
				className="edit-navigation-notices__notice-list"
				onRemove={ removeNotice }
			/>
			<SnackbarList
				notices={ snackbarNotices }
				className="edit-navigation-notices__snackbar-list"
				onRemove={ removeNotice }
			/>
		</>
	);
}
