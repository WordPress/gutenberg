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

// The React `on*` props the host bridges, mapped to their DOM event type. Only
// editing events are redirected under `editableRoot` (the wrapper becomes the
// editing host, so keyboard, input and composition events target it instead of
// the block); pointer and other events still reach the block and need no
// bridging. React prop names don't map to DOM types by lowercasing in general
// (onChange is `input`, onDoubleClick is `dblclick`), so the mapping is
// explicit, which also locks the bridged surface to events React actually fires.
const SUPPORTED_EVENTS = {
	onKeyDown: 'keydown',
	onKeyUp: 'keyup',
	onBeforeInput: 'beforeinput',
	onInput: 'input',
	onCompositionStart: 'compositionstart',
	onCompositionUpdate: 'compositionupdate',
	onCompositionEnd: 'compositionend',
};

// The DOM event types the host listens for. Fixed, so the host attaches these
// listeners once rather than tracking which types are in use.
const EVENT_TYPES = Object.values( SUPPORTED_EVENTS );

/**
 * Collects the supported `on*` event handlers from a set of props, e.g. a
 * block's merged `wrapperProps`, keyed by DOM event type. Used by the block to
 * register them (see `useRegisterBlockEventHandlers`).
 *
 * @param {Object} props Props to read handlers from.
 *
 * @return {Object|undefined} The handlers by event type, or undefined when
 *                            there are none.
 */
export function getEventHandlers( props ) {
	let handlers;

	for ( const name in SUPPORTED_EVENTS ) {
		if ( typeof props[ name ] === 'function' ) {
			handlers = handlers || {};
			handlers[ SUPPORTED_EVENTS[ name ] ] = props[ name ];
		}
	}

	return handlers;
}

// The native properties React copies onto its SyntheticEvent for each event
// type (the *EventInterface tables in react-dom), so the wrapper exposes exactly
// what a React handler would see and nothing more. Values are copied straight
// from the native event; React's normalizers only paper over browsers we don't
// support, and anything omitted stays reachable through `nativeEvent`, as in
// React (e.g. `getTargetRanges` on a `beforeinput`).
const EVENT_INTERFACE = [
	'eventPhase',
	'bubbles',
	'cancelable',
	'timeStamp',
	'defaultPrevented',
	'isTrusted',
];
const KEYBOARD_EVENT_INTERFACE = [
	...EVENT_INTERFACE,
	'view',
	'detail',
	'key',
	'code',
	'location',
	'ctrlKey',
	'shiftKey',
	'altKey',
	'metaKey',
	'repeat',
	'locale',
	'getModifierState',
	'charCode',
	'keyCode',
	'which',
];
const INPUT_EVENT_INTERFACE = [ ...EVENT_INTERFACE, 'data' ];
const EVENT_INTERFACES = {
	keydown: KEYBOARD_EVENT_INTERFACE,
	keyup: KEYBOARD_EVENT_INTERFACE,
	beforeinput: INPUT_EVENT_INTERFACE,
	input: INPUT_EVENT_INTERFACE,
	compositionstart: INPUT_EVENT_INTERFACE,
	compositionupdate: INPUT_EVENT_INTERFACE,
	compositionend: INPUT_EVENT_INTERFACE,
};

/**
 * Builds a React `SyntheticEvent`-like object for an extension handler, which
 * expects one. It mirrors what react-dom does: a plain object wrapping the real
 * native event, eagerly copying the same interface properties React exposes for
 * the event type, so a handler sees exactly React's surface and nothing more.
 *
 * `preventDefault` and `stopPropagation` forward to the native event, so they
 * behave as through React; `stopPropagation` also flags the walk through block
 * ancestors to stop. `target` is the editable inside the block rather than the
 * real target (the editing host above it), and `currentTarget` is reassigned as
 * the event bubbles from block to block.
 *
 * @param {Event}       nativeEvent The event to wrap.
 * @param {HTMLElement} target      The element to report as the target.
 *
 * @return {Object} The synthetic event.
 */
function createBlockSyntheticEvent( nativeEvent, target ) {
	let propagationStopped = false;

	const syntheticEvent = {
		nativeEvent,
		type: nativeEvent.type,
		target,
		currentTarget: null,
		preventDefault() {
			nativeEvent.preventDefault();
			syntheticEvent.defaultPrevented = true;
		},
		isDefaultPrevented() {
			return syntheticEvent.defaultPrevented;
		},
		stopPropagation() {
			nativeEvent.stopPropagation();
			propagationStopped = true;
		},
		isPropagationStopped() {
			return propagationStopped;
		},
		// The modern event system doesn't pool, so persistence is a no-op.
		persist() {},
		isPersistent() {
			return true;
		},
	};

	for ( const property of EVENT_INTERFACES[ nativeEvent.type ] ) {
		const value = nativeEvent[ property ];
		syntheticEvent[ property ] =
			typeof value === 'function' ? value.bind( nativeEvent ) : value;
	}

	return syntheticEvent;
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
	const { refsMap, eventHandlers } = useContext( BlockRefs );
	return useRefEffect(
		( node ) => {
			function onEvent( event ) {
				// Only act on real events targeting the host itself, while it
				// is the editing host for a single block and some block has a
				// handler to call.
				if (
					! eventHandlers.size ||
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
						eventHandlers.get( ancestorClientId )?.current?.[
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
		[ hasMultiSelection, getBlockParents, refsMap, eventHandlers ]
	);
}
