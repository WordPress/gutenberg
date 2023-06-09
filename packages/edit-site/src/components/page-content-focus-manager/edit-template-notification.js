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
 * Component that displays a 'Edit your template to edit this block'
 * notification when the user is focusing on editing page content and clicks on
 * a disabled template block.
 *
 * @param {Object}                                 props
 * @param {import('react').RefObject<HTMLElement>} props.contentRef Ref to the block
 *                                                                  editor iframe canvas.
 */
export default function EditTemplateNotification( { contentRef } ) {
	useEditTemplateNotification( contentRef );
	return null;
}

/**
 * Hook that displays a 'Edit your template to edit this block' notification
 * when the user is focusing on editing page content and clicks on a disabled
 * template block.
 *
 * @param {import('react').RefObject<HTMLElement>} contentRef Ref to the block
 *                                                            editor iframe canvas.
 */
function useEditTemplateNotification( contentRef ) {
	const hasPageContentFocus = useSelect(
		( select ) => select( editSiteStore ).hasPageContentFocus(),
		[]
	);

	const alreadySeen = useRef( false );

	const { createInfoNotice } = useDispatch( noticesStore );
	const { setHasPageContentFocus } = useDispatch( editSiteStore );

	useEffect( () => {
		const handleClick = ( event ) => {
			if (
				! alreadySeen.current &&
				hasPageContentFocus &&
				event.target.classList.contains( 'is-root-container' )
			) {
				createInfoNotice(
					__( 'Edit your template to edit this block' ),
					{
						isDismissible: true,
						type: 'snackbar',
						actions: [
							{
								label: __( 'Edit template' ),
								onClick: () => setHasPageContentFocus( false ),
							},
						],
					}
				);
				alreadySeen.current = true;
			}
		};
		const canvas = contentRef.current;
		canvas?.addEventListener( 'click', handleClick );
		return () => canvas?.removeEventListener( 'click', handleClick );
	}, [ alreadySeen, hasPageContentFocus, contentRef.current ] );
}
