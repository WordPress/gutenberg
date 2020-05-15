/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { NoticeList, SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export default function EditNavigationNotices() {
	const { removeNotice } = useDispatch( 'core/notices' );
	const notices = useSelect(
		( select ) => select( 'core/notices' ).getNotices(),
		[]
	);
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
