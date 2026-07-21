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
 * The real event is wrapped, so `preventDefault` reaches the browser and core.
 * `stopPropagation` is kept local: it only ends the walk through block
 * ancestors here, so a handler can't stop the event for core's own listeners.
 * `target` is overridden because the real event targets the editing host above
 * the block, while a handler expects the editable inside its block, as it would
 * without `editableRoot`. `currentTarget` is assignable, moved from block to
 * block as the event bubbles.
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
		// Kept local so a handler can't stop the event for core's listeners.
		stopPropagation: () => {
			propagationStopped = true;
		},
		stopImmediatePropagation: () => {
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
 * event, innermost first, like a bubbling event. The event wraps the real
 * native event, so `preventDefault` reaches the browser and core, while
 * `stopPropagation` is kept local to the walk through ancestors and can't
 * interfere with core's own listeners.
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

			// Non-capture, so a block's handler fires in the bubbling phase,
			// as its React `on*` handler would.
			const unsubscribers = EVENT_TYPES.map( ( type ) => {
				node.addEventListener( type, onEvent );
				return () => node.removeEventListener( type, onEvent );
			} );
			return () =>
				unsubscribers.forEach( ( unsubscribe ) => unsubscribe() );
		},
		[ hasMultiSelection, getBlockParents, refsMap ]
	);
}
