/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticeStore } from '@wordpress/notices';

function useNavigationNotice( { name, message = '' } = {} ) {
	const noticeRef = useRef();

	const { createWarningNotice, removeNotice } = useDispatch( noticeStore );

	const showNotice = ( customMsg ) => {
		if ( noticeRef.current ) {
			return;
		}

		noticeRef.current = name;

		createWarningNotice( customMsg || message, {
			id: noticeRef.current,
			type: 'snackbar',
		} );
	};

	const hideNotice = () => {
		if ( ! noticeRef.current ) {
			return;
		}
		removeNotice( noticeRef.current );
		noticeRef.current = null;
	};

	return [ showNotice, hideNotice ];
}

export default useNavigationNotice;
