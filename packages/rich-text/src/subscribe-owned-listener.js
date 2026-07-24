/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ownsSelection } from './owns-selection';
import { unlock } from './lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Subscribes a callback for events owned by the given editable element:
 * events targeting the element or its descendants, and events targeting a
 * focused editing host (e.g. an editable block editor canvas wrapper) while
 * the element contains the selection. In the latter case events target the
 * host, never the element, so an element-bound listener would not fire.
 *
 * @param {HTMLElement} element   The editable element.
 * @param {string}      eventType DOM event name.
 * @param {Function}    callback  Listener to be invoked with the event.
 * @param {boolean}     capture   Use the capture phase. Defaults to `false`.
 *
 * @return {Function} Unsubscribe function.
 */
export function subscribeOwnedListener(
	element,
	eventType,
	callback,
	capture = false
) {
	return subscribeDelegatedListener(
		element.ownerDocument,
		eventType,
		( event ) => {
			if (
				! element.contains( event.target ) &&
				! ownsSelection( element )
			) {
				return;
			}
			callback( event );
		},
		capture
	);
}
