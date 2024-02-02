/**
 * WordPress dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

export default function EditorSnackbars() {
	const notices = useSelect(
		( select ) => select( noticesStore ).getNotices(),
		[]
	);
	const { removeNotice } = useDispatch( noticesStore );
	const snackbarNotices = notices.filter(
		( { type } ) => type === 'snackbar'
	);

	return (
		<SnackbarList
			notices={ snackbarNotices }
			maxVisible={ 3 }
			className="components-editor-notices__snackbar"
			onRemove={ removeNotice }
		/>
	);
}
