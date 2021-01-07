/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

function Notices() {
	const { notices } = useSelect( ( select ) => {
		return {
			notices: select( noticesStore ).getNotices(),
		};
	}, [] );
	const snackbarNotices = filter( notices, {
		type: 'snackbar',
	} );
	const { removeNotice } = useDispatch( noticesStore );

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className="edit-widgets-notices__snackbar"
			onRemove={ removeNotice }
		/>
	);
}

export default Notices;
