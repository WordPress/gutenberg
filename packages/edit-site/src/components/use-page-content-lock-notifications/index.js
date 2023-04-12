/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function usePageContentLockNotifications() {
	const ref = useEditTemplateNotification();
	useBackToPageNotification();
	return ref;
}

function useEditTemplateNotification() {
	const hasPageContentLock = useSelect(
		( select ) => select( editSiteStore ).hasPageContentLock(),
		[]
	);

	const alreadySeen = useRef( false );

	const { createInfoNotice } = useDispatch( noticesStore );
	const { togglePageContentLock } = useDispatch( editSiteStore );

	return useRefEffect(
		( node ) => {
			if ( ! hasPageContentLock || alreadySeen.current ) {
				return;
			}

			const handleClick = ( event ) => {
				if ( event.target.classList.contains( 'is-root-container' ) ) {
					createInfoNotice(
						__( 'Edit your template to edit this block' ),
						{
							isDismissible: true,
							type: 'snackbar',
							actions: [
								{
									label: __( 'Edit template' ),
									onClick: () =>
										togglePageContentLock( false ),
								},
							],
						}
					);
					alreadySeen.current = true;
				}
			};

			node.addEventListener( 'click', handleClick );
			return () => node.removeEventListener( 'click', handleClick );
		},
		[ hasPageContentLock, alreadySeen.current ]
	);
}

function useBackToPageNotification() {
	const hasPageContentLock = useSelect(
		( select ) => select( editSiteStore ).hasPageContentLock(),
		[]
	);

	const alreadySeen = useRef( false );
	const prevHasPageContentLock = useRef( false );

	const { createInfoNotice } = useDispatch( noticesStore );
	const { togglePageContentLock } = useDispatch( editSiteStore );

	useEffect( () => {
		if ( alreadySeen.current ) {
			return;
		}
		if ( prevHasPageContentLock.current && ! hasPageContentLock ) {
			createInfoNotice( __( 'You are editing a template' ), {
				isDismissible: true,
				type: 'snackbar',
				actions: [
					{
						label: __( 'Back to page' ),
						onClick: () => togglePageContentLock( true ),
					},
				],
			} );
			alreadySeen.current = true;
		}
		prevHasPageContentLock.current = hasPageContentLock;
	}, [
		alreadySeen,
		prevHasPageContentLock,
		hasPageContentLock,
		createInfoNotice,
		togglePageContentLock,
	] );
}
