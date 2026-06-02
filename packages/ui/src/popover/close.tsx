import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { CloseProps } from './types';

/**
 * Renders a button that closes the popover when clicked.
 *
 * When the popover opens, initial focus skips this button in favor of
 * the first interactive element inside the popup (unless `initialFocus`
 * on `Popover.Popup` overrides this behavior).
 */
const Close = forwardRef< HTMLButtonElement, CloseProps >(
	function PopoverClose( { onClickCapture, ...props }, ref ) {
		return (
			<_Popover.Close
				ref={ ref }
				data-wp-ui-popover-close=""
				onClickCapture={ ( event ) => {
					// Base UI records the clicked element as the close
					// "trigger" and, when that element has an `id` (e.g. a
					// `Popover.Close` rendered as an `IconButton`, whose inner
					// tooltip generates one), re-anchors the popover to it on
					// close. With an exit animation this surfaces as the popover
					// jumping to the close button before fading out. Hide the id
					// for the synchronous window in which Base UI reads it (its
					// `onClick` runs in the bubble phase, after this capture
					// handler) so the popover stays anchored to its trigger,
					// then restore it for accessibility once the event settles.
					const element = event.currentTarget;
					const { id } = element;
					if ( id ) {
						element.removeAttribute( 'id' );
						// Restore after the click finishes dispatching. A
						// microtask would run too early: the HTML spec performs
						// a microtask checkpoint after each event listener, so
						// the id would be back before Base UI's bubble-phase
						// `onClick` reads it. `requestAnimationFrame` defers past
						// the whole event.
						const view = element.ownerDocument.defaultView;
						view?.requestAnimationFrame( () => {
							if ( ! element.id ) {
								element.id = id;
							}
						} );
					}
					onClickCapture?.( event );
				} }
				{ ...props }
			/>
		);
	}
);

export { Close };
