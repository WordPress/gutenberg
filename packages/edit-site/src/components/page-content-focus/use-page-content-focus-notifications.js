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

/**
 * Hook that displays notifications that guide the user towards using the
 * content vs. template editing modes.
 *
 * @return {import('react').RefObject<HTMLElement>} Ref which should be passed
 *                                                  (using useMergeRefs()) to
 *                                                  the editor iframe canvas.
 */
export function usePageContentFocusNotifications() {
	const ref = useEditTemplateNotification();
	useBackToPageNotification();
	return ref;
}

/**
 * Hook that displays a 'Edit your template to edit this block' notification
 * when the user is focusing on editing page content and clicks on a disabled
 * template block.
 *
 * @return {import('react').RefObject<HTMLElement>} Ref which should be passed
 *                                                  (using useMergeRefs()) to
 *                                                  the editor iframe canvas.
 */
function useEditTemplateNotification() {
	const hasPageContentFocus = useSelect(
		( select ) => select( editSiteStore ).hasPageContentFocus(),
		[]
	);

	const alreadySeen = useRef( false );

	const { createInfoNotice } = useDispatch( noticesStore );
	const { setHasPageContentFocus } = useDispatch( editSiteStore );

	return useRefEffect(
		( node ) => {
			const handleClick = ( event ) => {
				if (
					hasPageContentFocus &&
					event.target.classList.contains( 'is-root-container' )
				) {
					node.ownerDocument
						.querySelectorAll(
							'.block-editor-block-list__block:not(.is-editing-disabled)'
						)
						.forEach( ( block ) => {
							block.classList.remove( 'flash-outline' );
							block.offsetWidth; // eslint-disable-line no-unused-expressions
							block.classList.add( 'flash-outline' );
						} );
					if ( ! alreadySeen.current ) {
						createInfoNotice(
							__( 'Edit your template to edit this block' ),
							{
								isDismissible: true,
								type: 'snackbar',
								actions: [
									{
										label: __( 'Edit template' ),
										onClick: () =>
											setHasPageContentFocus( false ),
									},
								],
							}
						);
						alreadySeen.current = true;
					}
				}
			};
			node.addEventListener( 'click', handleClick );
			return () => node.removeEventListener( 'click', handleClick );
		},
		[
			hasPageContentFocus,
			alreadySeen,
			createInfoNotice,
			setHasPageContentFocus,
		]
	);
}

/**
 * Hook that displays a 'You are editing a template' notification when the user
 * switches from focusing on editing page content to editing a template.
 */
function useBackToPageNotification() {
	const hasPageContentFocus = useSelect(
		( select ) => select( editSiteStore ).hasPageContentFocus(),
		[]
	);

	const alreadySeen = useRef( false );
	const prevHasPageContentFocus = useRef( false );

	const { createInfoNotice } = useDispatch( noticesStore );
	const { setHasPageContentFocus } = useDispatch( editSiteStore );

	useEffect( () => {
		if (
			! alreadySeen.current &&
			prevHasPageContentFocus.current &&
			! hasPageContentFocus
		) {
			createInfoNotice( __( 'You are editing a template' ), {
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
		prevHasPageContentFocus,
		hasPageContentFocus,
		createInfoNotice,
		setHasPageContentFocus,
	] );
}
