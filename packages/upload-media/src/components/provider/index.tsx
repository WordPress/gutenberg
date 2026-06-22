/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { unlock } from '../../lock-unlock';
import { store as uploadStore } from '../../store';

const RESUME_NOTICE_ID = 'upload-media/resume-interrupted';

const MediaUploadProvider = withRegistryProvider( ( props: any ) => {
	const { children, settings } = props;
	const registry = useRegistry();
	const { updateSettings } = unlock( useDispatch( uploadStore ) );

	useEffect( () => {
		updateSettings( settings );
	}, [ settings, updateSettings ] );

	// Detect and offer to resume uploads interrupted by a reload or crash.
	useEffect( () => {
		if ( settings?.durableQueue === false ) {
			return;
		}

		let cancelled = false;

		( async () => {
			const dispatch = unlock( registry.dispatch( uploadStore ) );
			const { createWarningNotice, removeNotice } =
				registry.dispatch( noticesStore );

			await dispatch.loadPersistedQueue();
			if ( cancelled ) {
				return;
			}

			const count = unlock(
				registry.select( uploadStore )
			).getResumableItems().length;
			if ( count === 0 ) {
				return;
			}

			createWarningNotice(
				sprintf(
					/* translators: %d: number of interrupted uploads. */
					_n(
						'%d media upload was interrupted.',
						'%d media uploads were interrupted.',
						count
					),
					count
				),
				{
					id: RESUME_NOTICE_ID,
					actions: [
						{
							label: __( 'Resume' ),
							onClick: () => {
								dispatch.resumePersistedQueue();
								removeNotice( RESUME_NOTICE_ID );
							},
						},
						{
							label: __( 'Discard' ),
							onClick: () => {
								dispatch.discardPersistedQueue();
								removeNotice( RESUME_NOTICE_ID );
							},
						},
					],
				}
			);
		} )();

		return () => {
			cancelled = true;
		};
		// Run once on mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return <>{ children }</>;
} );

export default MediaUploadProvider;
