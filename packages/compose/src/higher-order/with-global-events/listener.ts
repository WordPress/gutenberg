import type { ListenerInstance } from './types';

/**
 * Class responsible for orchestrating event handling on the global window,
 * binding a single event to be shared across all handling instances, and
 * removing the handler when no instances are listening for the event.
 */
class Listener {
	declare listeners: Record< string, ListenerInstance[] >;

	constructor() {
		this.listeners = {};

		this.handleEvent = this.handleEvent.bind( this );
	}

	add( eventType: string, instance: ListenerInstance ) {
		if ( ! this.listeners[ eventType ] ) {
			// Adding first listener for this type, so bind event.
			window.addEventListener( eventType, this.handleEvent );
			this.listeners[ eventType ] = [];
		}

		this.listeners[ eventType ].push( instance );
	}

	remove( eventType: string, instance: ListenerInstance ) {
		if ( ! this.listeners[ eventType ] ) {
			return;
		}

		this.listeners[ eventType ] = this.listeners[ eventType ].filter(
			( listener ) => listener !== instance
		);

		if ( ! this.listeners[ eventType ].length ) {
			// Removing last listener for this type, so unbind event.
			window.removeEventListener( eventType, this.handleEvent );
			delete this.listeners[ eventType ];
		}
	}

	handleEvent( event: Event ) {
		this.listeners[ event.type ]?.forEach( ( instance ) => {
			instance.handleEvent( event );
		} );
	}
}

export default Listener;
