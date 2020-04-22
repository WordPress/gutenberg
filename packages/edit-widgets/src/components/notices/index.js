/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

function Notices() {
	const { notices } = useSelect( ( select ) => {
		return {
			notices: select( 'core/notices' ).getNotices(),
		};
	}, [] );
	const snackbarNotices = filter( notices, {
		type: 'snackbar',
	} );
	const { removeNotice } = useDispatch( 'core/notices' );

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className="edit-widgets-notices__snackbar"
			onRemove={ removeNotice }
		/>
	);
}

export default Notices;
