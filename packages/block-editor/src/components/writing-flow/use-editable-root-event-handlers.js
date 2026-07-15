/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getSelectionEditableElement } from '../../utils/dom';
import {
	getBlockEventHandlers,
	subscribeEventTypes,
	getEventTypes,
} from './editable-root-event-handlers';

/**
 * Wraps a native event in a React `SyntheticEvent`-like object to pass to
 * extension handlers, which expect one. React does not export a way to
 * construct a synthetic event, but its own is a thin wrapper over a native
 * event (see `createSyntheticEvent` in react-dom): reads delegate to the
 * native event, and `preventDefault` / `stopPropagation` are methods paired
 * with `isDefaultPrevented` / `isPropagationStopped`.
 *
 * The native event is a copy, not the original, so `stopPropagation` on it
 * can't interfere with core; the caller mirrors `defaultPrevented` back to the
 * original. `currentTarget` is assignable, updated as the event bubbles
 * through block ancestors. `isTrusted` is `false`, as for any scripted event.
 *
 * @param {Event}       nativeEvent A copy of the event to wrap.
 * @param {HTMLElement} target      The element the event is dispatched at.
 *
 * @return {Object} The synthetic event.
 */
function createBlockSyntheticEvent( nativeEvent, target ) {
	let currentTarget = null;
	let propagationStopped = false;

	const properties = {
		nativeEvent,
		target,
		preventDefault: () => nativeEvent.preventDefault(),
		isDefaultPrevented: () => nativeEvent.defaultPrevented,
		stopPropagation: () => {
			propagationStopped = true;
		},
		isPropagationStopped: () => propagationStopped,
		// The modern event system doesn't pool, so persistence is a no-op.
		persist: () => {},
		isPersistent: () => true,
	};

	return new Proxy( nativeEvent, {
		get( event, property ) {
			if ( property === 'currentTarget' ) {
				return currentTarget;
			}
			if ( Object.hasOwn( properties, property ) ) {
				return properties[ property ];
			}
			const value = event[ property ];
			return typeof value === 'function' ? value.bind( event ) : value;
		},
		set( event, property, value ) {
			if ( property === 'currentTarget' ) {
				currentTarget = value;
			}
			return true;
		},
	} );
}

/**
 * Backwards compatibility for block event handlers under `editableRoot`.
 *
 * When a block supports `editableRoot`, the writing flow wrapper is the
 * contentEditable editing host, so keyboard, input and composition events
 * target the wrapper instead of the block. React `on*` handlers a third party
 * added to a block through `wrapperProps` (e.g. via an `editor.BlockListBlock`
 * filter) are on the block element, below the target, so they stop firing.
 *
 * The block registers those handlers (see `useBlockProps`), and this hook
 * calls them from the host: it resolves the block that owns the selection and
 * every block ancestor, and invokes each registered handler with a synthetic
 * event, innermost first, like a bubbling event. The event wraps a copy, so
 * `stopPropagation` (honored between ancestors here) can't interfere with core,
 * and `preventDefault` is mirrored back to the original so the browser and core
 * honor it.
 *
 * This does not cover handlers a filter puts on its own wrapping element rather
 * than the block's `wrapperProps`; the block element is the supported event
 * surface. It can be removed once input handling is lifted to the host.
 */
export default function useEditableRootEventHandlers() {
	const { hasMultiSelection, getBlockParents } =
		useSelect( blockEditorStore );
	// The event types blocks have handlers for. The host listens for exactly
	// these, re-attaching when the set changes, rather than a fixed list.
	const eventTypes = useSyncExternalStore(
		subscribeEventTypes,
		getEventTypes
	);
	return useRefEffect(
		( node ) => {
			function onEvent( event ) {
				// Only act on real events targeting the host itself, while it
				// is the editing host for a single block.
				if (
					event.target !== node ||
					! event.isTrusted ||
					node.contentEditable !== 'true' ||
					hasMultiSelection()
				) {
					return;
				}

				const selection = node.ownerDocument.defaultView.getSelection();

				if ( ! selection.rangeCount ) {
					return;
				}

				const editable = getSelectionEditableElement( selection, node );
				const blockElement = editable?.closest( '[data-block]' );

				if ( ! blockElement ) {
					return;
				}

				// The block that owns the selection and its block ancestors,
				// innermost first, taking the hierarchy from the store rather
				// than walking the DOM.
				const clientId = blockElement.getAttribute( 'data-block' );
				const elements = [
					blockElement,
					...getBlockParents( clientId, true )
						.map( ( parentClientId ) =>
							node.querySelector(
								`[data-block="${ parentClientId }"]`
							)
						)
						.filter( Boolean ),
				];

				let syntheticEvent;
				for ( const element of elements ) {
					const handler =
						getBlockEventHandlers( element )?.[ event.type ];

					if ( ! handler ) {
						continue;
					}

					if ( ! syntheticEvent ) {
						syntheticEvent = createBlockSyntheticEvent(
							new event.constructor( event.type, event ),
							editable
						);
					}

					syntheticEvent.currentTarget = element;
					handler( syntheticEvent );

					if ( syntheticEvent.isPropagationStopped() ) {
						break;
					}
				}

				if ( syntheticEvent?.nativeEvent.defaultPrevented ) {
					event.preventDefault();
				}
			}

			const unsubscribers = eventTypes.map( ( type ) => {
				node.addEventListener( type, onEvent, true );
				return () => node.removeEventListener( type, onEvent, true );
			} );
			return () =>
				unsubscribers.forEach( ( unsubscribe ) => unsubscribe() );
		},
		[ hasMultiSelection, getBlockParents, eventTypes ]
	);
}
