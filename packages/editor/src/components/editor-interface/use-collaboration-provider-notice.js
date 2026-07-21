/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

const NOTICE_ID = 'editor-missing-collaboration-provider';

export default function useCollaborationProviderNotice( {
	isCollaborationEnabled,
	hasProviders,
} ) {
	const { createWarningNotice, removeNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( ! isCollaborationEnabled || hasProviders ) {
			return;
		}

		createWarningNotice(
			__(
				'Real-time collaboration is enabled, but no collaboration provider is registered.'
			),
			{
				id: NOTICE_ID,
				isDismissible: true,
			}
		);

		return () => removeNotice( NOTICE_ID );
	}, [
		createWarningNotice,
		hasProviders,
		isCollaborationEnabled,
		removeNotice,
	] );
}
