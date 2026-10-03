import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useRef } from '@wordpress/element';

export default function usePublishNavigationMenu( id ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const isPublishingRef = useRef( false );

	const publish = useCallback( async () => {
		if ( ! id || isPublishingRef.current ) {
			return;
		}

		isPublishingRef.current = true;
		setIsPublishing( true );

		try {
			await saveEntityRecord(
				'postType',
				'wp_navigation',
				{ id, status: 'publish' },
				{ throwOnError: true }
			);
			speak( __( 'Navigation menu published.' ) );
		} catch {
			createErrorNotice( __( 'Unable to publish the navigation menu.' ), {
				type: 'snackbar',
			} );
		} finally {
			isPublishingRef.current = false;
			setIsPublishing( false );
		}
	}, [ id, saveEntityRecord, createErrorNotice ] );

	return { publish, isPublishing };
}
