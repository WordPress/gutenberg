/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticeStore } from '@wordpress/notices';

function useNavigationNotice( {
	name,
	message,
	createOn,
	destroyOn,
	navEntityIdRef,
} = {} ) {
	const noticeRef = useRef();

	const { createWarningNotice, removeNotice } = useDispatch( noticeStore );

	useEffect( () => {
		const setPermissionsNotice = () => {
			if ( noticeRef.current ) {
				return;
			}

			noticeRef.current = name;

			createWarningNotice( message, {
				id: noticeRef.current,
				type: 'snackbar',
			} );
		};

		const removePermissionsNotice = () => {
			if ( ! noticeRef.current ) {
				return;
			}
			removeNotice( noticeRef.current );
			noticeRef.current = null;
		};

		if ( destroyOn ) {
			removePermissionsNotice();
		}

		if ( createOn ) {
			setPermissionsNotice();
		}
	}, [ navEntityIdRef, createOn, destroyOn ] );
}

export default useNavigationNotice;
