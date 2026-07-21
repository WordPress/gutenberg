// The React `on*` props the host bridges, mapped to their DOM event type.
// Only editing events are redirected under `editableRoot` (the wrapper becomes
// the editing host, so keyboard, input and composition events target it instead
// of the block); pointer and other events still reach the block and need no
// bridging. React prop names don't map to DOM types by lowercasing in
// general (onChange is `input`, onDoubleClick is `dblclick`), so the mapping is
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

/**
 * The DOM event types the host listens for. Fixed, so the host attaches these
 * listeners once rather than tracking which types are in use.
 *
 * @type {string[]}
 */
export const EVENT_TYPES = Object.values( SUPPORTED_EVENTS );

/**
 * Collects the supported `on*` event handlers from a set of props, e.g. a
 * block's merged `wrapperProps`, keyed by DOM event type.
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
