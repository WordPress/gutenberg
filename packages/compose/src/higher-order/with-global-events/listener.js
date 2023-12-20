/**
 * Class responsible for orchestrating event handling on the global window,
 * binding a single event to be shared across all handling instances, and
 * removing the handler when no instances are listening for the event.
 */
class Listener {
	constructor() {
		/** @type {any} */
		this.listeners = {};

		this.handleEvent = this.handleEvent.bind( this );
	}

	add( /** @type {any} */ eventType, /** @type {any} */ instance ) {
		if ( ! this.listeners[ eventType ] ) {
			// Adding first listener for this type, so bind event.
			window.addEventListener( eventType, this.handleEvent );
			this.listeners[ eventType ] = [];
		}

		this.listeners[ eventType ].push( instance );
	}

	remove( /** @type {any} */ eventType, /** @type {any} */ instance ) {
		if ( ! this.listeners[ eventType ] ) {
			return;
		}

		this.listeners[ eventType ] = this.listeners[ eventType ].filter(
			( /** @type {any} */ listener ) => listener !== instance
		);

		if ( ! this.listeners[ eventType ].length ) {
			// Removing last listener for this type, so unbind event.
			window.removeEventListener( eventType, this.handleEvent );
			delete this.listeners[ eventType ];
		}
	}

	handleEvent( /** @type {any} */ event ) {
		this.listeners[ event.type ]?.forEach(
			( /** @type {any} */ instance ) => {
				instance.handleEvent( event );
			}
		);
	}
}

export default Listener;
