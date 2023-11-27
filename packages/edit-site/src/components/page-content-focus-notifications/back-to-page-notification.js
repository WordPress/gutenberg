/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

/**
 * Component that displays a 'You are editing a template' notification when the
 * user switches from focusing on editing page content to editing a template.
 */
export default function BackToPageNotification() {
	useBackToPageNotification();
	return null;
}

/**
 * Hook that displays a 'You are editing a template' notification when the user
 * switches from focusing on editing page content to editing a template.
 */
export function useBackToPageNotification() {
	const renderingMode = useSelect(
		( select ) => select( editorStore ).getRenderingMode(),
		[]
	);
	const { isPage } = useSelect( editSiteStore );
	const { setRenderingMode } = useDispatch( editorStore );
	const { createInfoNotice } = useDispatch( noticesStore );

	const alreadySeen = useRef( false );

	useEffect( () => {
		if (
			isPage() &&
			! alreadySeen.current &&
			renderingMode === 'template-only'
		) {
			createInfoNotice( __( 'You are editing a template.' ), {
				isDismissible: true,
				type: 'snackbar',
				actions: [
					{
						label: __( 'Back to page' ),
						onClick: () => setRenderingMode( 'template-locked' ),
					},
				],
			} );
			alreadySeen.current = true;
		}
	}, [ isPage, renderingMode, createInfoNotice, setRenderingMode ] );
}
