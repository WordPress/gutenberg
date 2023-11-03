/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

/**
 * Component that displays a 'You are editing a template' notification when the
 * user switches from focusing on editing page content to editing a template.
 *
 * @param {Object} props         The component props.
 * @param {Object} props.context The context of the current page.
 */
export default function BackToPageNotification( { context } ) {
	useBackToPageNotification( context );
	return null;
}

/**
 * Hook that displays a 'You are editing a template' notification when the user
 * switches from focusing on editing page content to editing a template.
 *
 * @param {Object} context The context of the current page.
 */
export function useBackToPageNotification( context ) {
	const { hasPageContentFocus } = useSelect(
		( select ) => ( {
			hasPageContentFocus: select( editSiteStore ).hasPageContentFocus(),
		} ),
		[]
	);

	const alreadySeen = useRef( false );
	const prevHasPageContentFocus = useRef( false );

	const { createInfoNotice } = useDispatch( noticesStore );
	const { setHasPageContentFocus } = useDispatch( editSiteStore );
	const isPage = !! context?.postId;

	useEffect( () => {
		if (
			! alreadySeen.current &&
			isPage &&
			prevHasPageContentFocus.current &&
			! hasPageContentFocus
		) {
			createInfoNotice( __( 'You are editing a template.' ), {
				isDismissible: true,
				type: 'snackbar',
				actions: [
					{
						label: __( 'Back to page' ),
						onClick: () => setHasPageContentFocus( true ),
					},
				],
			} );
			alreadySeen.current = true;
		}
		prevHasPageContentFocus.current = hasPageContentFocus;
	}, [
		alreadySeen,
		isPage,
		prevHasPageContentFocus,
		hasPageContentFocus,
		createInfoNotice,
		setHasPageContentFocus,
	] );
}
