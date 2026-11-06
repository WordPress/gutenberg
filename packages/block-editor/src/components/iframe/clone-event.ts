// Members of each `*EventInit` dictionary. Copying all source fields without limits
// can lead to unexpected bugs: for example, WebKit doesn't like `KeyboardEvent` clones
// with the legacy `keyIdentifier` field set explicitly.
// Modelled on the per-event interfaces that React uses to build a synthetic event from a
// native one:
// https://github.com/react/react/blob/main/packages/react-dom-bindings/src/events/SyntheticEvent.js
const EVENT_FIELDS = [ 'bubbles', 'cancelable', 'composed' ];

const UI_EVENT_FIELDS = [ ...EVENT_FIELDS, 'detail', 'view' ];

const MOUSE_EVENT_FIELDS = [
	...UI_EVENT_FIELDS,
	'screenX',
	'screenY',
	'clientX',
	'clientY',
	'ctrlKey',
	'shiftKey',
	'altKey',
	'metaKey',
	'button',
	'buttons',
	'relatedTarget',
	'movementX',
	'movementY',
];

const DRAG_EVENT_FIELDS = [ ...MOUSE_EVENT_FIELDS, 'dataTransfer' ];

const POINTER_EVENT_FIELDS = [
	...MOUSE_EVENT_FIELDS,
	'pointerId',
	'width',
	'height',
	'pressure',
	'tangentialPressure',
	'tiltX',
	'tiltY',
	'twist',
	'altitudeAngle',
	'azimuthAngle',
	'pointerType',
	'isPrimary',
];

const KEYBOARD_EVENT_FIELDS = [
	...UI_EVENT_FIELDS,
	'key',
	'code',
	'location',
	'repeat',
	'isComposing',
	'ctrlKey',
	'shiftKey',
	'altKey',
	'metaKey',
	// Deprecated, but still widely read, and they default to 0 if omitted.
	'charCode',
	'keyCode',
	'which',
];

// The members to copy, by the event interface they belong to. An interface
// missing here copies only the base members, so add one when bridging an
// event that implements it.
const EVENT_FIELDS_BY_INTERFACE: Record< string, readonly string[] > = {
	Event: EVENT_FIELDS,
	UIEvent: UI_EVENT_FIELDS,
	MouseEvent: MOUSE_EVENT_FIELDS,
	DragEvent: DRAG_EVENT_FIELDS,
	PointerEvent: POINTER_EVENT_FIELDS,
	KeyboardEvent: KEYBOARD_EVENT_FIELDS,
};

// Only reachable via getModifierState(), so a field copy misses them.
const MODIFIER_MEMBERS = {
	modifierAltGraph: 'AltGraph',
	modifierCapsLock: 'CapsLock',
	modifierNumLock: 'NumLock',
	modifierScrollLock: 'ScrollLock',
	modifierFn: 'Fn',
	modifierSymbol: 'Symbol',
};

/**
 * An event constructor `cloneEvent` creates the parent document's event with.
 */
type EventConstructor = new (
	type: string,
	init?: Record< string, unknown >
) => Event;

/**
 * Resolves the constructor of an event interface in the parent window, so the
 * redispatched event is created in this realm (not the iframe's).
 *
 * @param interfaceName Name of the event interface, such as `PointerEvent`.
 */
function getEventConstructor( interfaceName: string ) {
	return ( window as unknown as Record< string, EventConstructor > )[
		interfaceName
	];
}

/**
 * Copies an iframe document event into an event of the parent document, ready
 * to dispatch on the outer `<iframe>` element.
 *
 * @param event Event from the iframe document.
 * @param frame The `<iframe>` element the copy is dispatched on.
 */
export function cloneEvent( event: Event, frame: HTMLIFrameElement ) {
	// Which members to copy follows the interface the event implements, not
	// its type: a browser may dispatch `click` as a `PointerEvent` where
	// another dispatches a `MouseEvent`.
	const interfaceName = Object.getPrototypeOf( event ).constructor.name;
	const init: {
		clientX?: number;
		clientY?: number;
		[ key: string ]: unknown;
	} = {};

	for ( const field of EVENT_FIELDS_BY_INTERFACE[ interfaceName ] ??
		EVENT_FIELDS ) {
		init[ field ] = ( event as unknown as Record< string, unknown > )[
			field
		];
	}

	for ( const member in MODIFIER_MEMBERS ) {
		init[ member ] = ( event as KeyboardEvent ).getModifierState(
			MODIFIER_MEMBERS[ member as keyof typeof MODIFIER_MEMBERS ]
		);
	}

	// Check if the event is a MouseEvent generated within the iframe.
	// If so, adjust the coordinates to be relative to the position of
	// the iframe. This ensures that components such as Draggable
	// receive coordinates relative to the window, instead of relative
	// to the iframe. Without this, the Draggable event handler would
	// result in components "jumping" position as soon as the user
	// drags over the iframe.
	if (
		// A frame that dispatches events has a document and window.
		event instanceof
		( frame.contentDocument!.defaultView! as typeof window ).MouseEvent
	) {
		const rect = frame.getBoundingClientRect();
		// Mouse events have coordinates.
		init.clientX! += rect.left;
		init.clientY! += rect.top;
	}

	const clone = new ( getEventConstructor( interfaceName ) )(
		event.type,
		init
	);
	if ( event.defaultPrevented ) {
		clone.preventDefault();
	}
	return clone;
}
