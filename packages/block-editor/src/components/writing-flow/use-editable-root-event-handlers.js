/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getBlockClientId, getSelectionEditableElement } from '../../utils/dom';
import { BlockRefs } from '../provider/block-refs-provider';
import {
	EVENT_TYPES,
	getBlockEventHandlers,
	hasBlockEventHandlers,
} from './editable-root-event-handlers';

/**
 * Wraps a native event in a React `SyntheticEvent`-like object to pass to
 * extension handlers, which expect one. React does not export a way to
 * construct a synthetic event, but its own is a thin wrapper over the real
 * native event (see `createSyntheticEvent` in react-dom): reads delegate to the
 * native event, and `preventDefault` / `stopPropagation` are methods paired
 * with `isDefaultPrevented` / `isPropagationStopped`.
 *
 * The real event is wrapped, so `preventDefault` and `stopPropagation` reach it
 * and behave as React's do (`stopPropagation` also ends the walk through block
 * ancestors via a local flag). `target` is overridden because the real event
 * targets the editing host above the block, while a handler expects the
 * editable inside its block, as it would without `editableRoot`. `currentTarget`
 * is assignable, moved from block to block as the event bubbles.
 *
 * @param {Event}       nativeEvent The event to wrap.
 * @param {HTMLElement} target      The element to report as the target.
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
		// Forwarded to the native event, as React does, plus a local flag to
		// end the walk through block ancestors. The host listens where React
		// listens (the portal container), so this stops propagation at the
		// same point and can't cut core's listeners below it.
		stopPropagation: () => {
			nativeEvent.stopPropagation();
			propagationStopped = true;
		},
		isPropagationStopped: () => propagationStopped,
		// Not exposed, as on React's synthetic event. Reaching the native
		// method would let a handler stop core's listeners on the host.
		stopImmediatePropagation: undefined,
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
 * event, innermost first, like a bubbling event. The listeners are attached
 * where React attaches its own (the portal container, the iframe's document
 * element), so a block's handler runs and its `preventDefault` /
 * `stopPropagation` behave as they would through React, without editableRoot.
 *
 * This does not cover handlers a filter puts on its own wrapping element rather
 * than the block's `wrapperProps`; the block element is the supported event
 * surface. It can be removed once input handling is lifted to the host.
 */
export default function useEditableRootEventHandlers() {
	const { hasMultiSelection, getBlockParents } =
		useSelect( blockEditorStore );
	const { refsMap } = useContext( BlockRefs );
	return useRefEffect(
		( node ) => {
			function onEvent( event ) {
				// Only act on real events targeting the host itself, while it
				// is the editing host for a single block and some block has a
				// handler to call.
				if (
					! hasBlockEventHandlers() ||
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
				const clientId = getBlockClientId( editable );

				if ( ! clientId ) {
					return;
				}

				// Call the handler on the block that owns the selection and each
				// of its block ancestors, innermost first, like a bubbling
				// event. The hierarchy comes from the store rather than the DOM,
				// and one synthetic event, wrapping the real event, is reused
				// for the whole chain, its currentTarget moved from block to
				// block. The element is only resolved for blocks with a handler.
				const clientIds = [
					clientId,
					...getBlockParents( clientId, true ),
				];

				let syntheticEvent;
				for ( const ancestorClientId of clientIds ) {
					const handler =
						getBlockEventHandlers( ancestorClientId )?.[
							event.type
						];
					const element = handler && refsMap.get( ancestorClientId );

					if ( ! element ) {
						continue;
					}

					if ( ! syntheticEvent ) {
						syntheticEvent = createBlockSyntheticEvent(
							event,
							editable
						);
					}

					syntheticEvent.currentTarget = element;
					handler( syntheticEvent );

					if ( syntheticEvent.isPropagationStopped() ) {
						break;
					}
				}
			}

			// Attach where React attaches its own event system: the portal
			// container, which for the iframed canvas is the document element
			// (see `preparePortalMount` in react-dom). Listening at the same
			// node, non-capture, means a block's handler runs in the bubbling
			// phase after core, and its stopPropagation stops at the same point
			// React's would, as its `on*` handler would without editableRoot.
			const root = node.ownerDocument.documentElement;
			const unsubscribers = EVENT_TYPES.map( ( type ) => {
				root.addEventListener( type, onEvent );
				return () => root.removeEventListener( type, onEvent );
			} );
			return () =>
				unsubscribers.forEach( ( unsubscribe ) => unsubscribe() );
		},
		[ hasMultiSelection, getBlockParents, refsMap ]
	);
}
