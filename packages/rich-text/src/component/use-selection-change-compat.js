/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Sometimes some browsers are not firing a `selectionchange` event when
 * changing the selection by mouse or keyboard. This hook makes sure that, if we
 * detect no `selectionchange` or `input` event between the up and down events,
 * we fire a `selectionchange` event.
 *
 * @return {import('@wordpress/compose').RefEffect} A ref effect attaching the
 *                                                  listeners.
 */
export function useSelectionChangeCompat() {
	return useRefEffect( ( element ) => {
		const { ownerDocument } = element;

		function onDown( event ) {
			const type = event.type === 'keydown' ? 'keyup' : 'pointerup';

			function onCancel() {
				ownerDocument.removeEventListener( type, onUp );
				ownerDocument.removeEventListener(
					'selectionchange',
					onCancel
				);
				ownerDocument.removeEventListener( 'input', onCancel );
			}

			function onUp() {
				onCancel();
				ownerDocument.dispatchEvent( new Event( 'selectionchange' ) );
			}

			ownerDocument.addEventListener( type, onUp );
			ownerDocument.addEventListener( 'selectionchange', onCancel );
			ownerDocument.addEventListener( 'input', onCancel );
		}

		element.addEventListener( 'pointerdown', onDown );
		element.addEventListener( 'keydown', onDown );
		return () => {
			element.removeEventListener( 'pointerdown', onDown );
			element.removeEventListener( 'keydown', onDown );
		};
	}, [] );
}
