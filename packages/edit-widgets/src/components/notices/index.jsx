import { InlineNotices, SnackbarNotices } from '@wordpress/notices';
import { ThemeProvider } from '@wordpress/theme';

function Notices() {
	return (
		<>
			<ThemeProvider cornerRadius="none">
				<InlineNotices
					className="edit-widgets-notices"
					pinnedNoticesClassName="edit-widgets-notices__pinned"
					dismissibleNoticesClassName="edit-widgets-notices__dismissible"
				/>
			</ThemeProvider>
			<SnackbarNotices className="edit-widgets-notices__snackbar" />
		</>
	);
}

export default Notices;
