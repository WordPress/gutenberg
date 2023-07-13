/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticeStore } from '@wordpress/notices';

function useNavigationNotice( { name, message = '' } = {} ) {
	const noticeRef = useRef();

	const { createWarningNotice, removeNotice } = useDispatch( noticeStore );

	const showNotice = useCallback(
		( customMsg ) => {
			if ( noticeRef.current ) {
				return;
			}

			noticeRef.current = name;

			createWarningNotice( customMsg || message, {
				id: noticeRef.current,
				type: 'snackbar',
			} );
		},
		[ noticeRef, createWarningNotice, message, name ]
	);

	const hideNotice = useCallback( () => {
		if ( ! noticeRef.current ) {
			return;
		}
		removeNotice( noticeRef.current );
		noticeRef.current = null;
	}, [ noticeRef, removeNotice ] );

	return [ showNotice, hideNotice ];
}

export default useNavigationNotice;
