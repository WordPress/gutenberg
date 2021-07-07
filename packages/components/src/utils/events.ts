type EventHandler< T extends Event > = ( event: T ) => void;

/**
 * Merges event handlers together.
 *
 * @template TEvent
 * @param  handler
 * @param  otherHandler
 */
function mergeEvent< TEvent extends Event >(
	handler: EventHandler< TEvent >,
	otherHandler: EventHandler< TEvent >
): EventHandler< TEvent > {
	return ( event: TEvent ) => {
		if ( typeof handler === 'function' ) {
			handler( event );
		}
		if ( typeof otherHandler === 'function' ) {
			otherHandler( event );
		}
	};
}

/**
 * Merges a set of event handlers together.
 *
 * @template TEvent
 * @param  handlers
 * @param  extraHandlers
 */
export function mergeEventHandlers<
	TEvent extends Event,
	TLeft extends Record< string, EventHandler< TEvent > >,
	TRight extends Record< string, EventHandler< TEvent > >
>( handlers: TLeft, extraHandlers: TRight ): TLeft & TRight {
	// @ts-ignore We'll fill in all the properties below
	const mergedHandlers: TLeft & TRight = {
		...handlers,
	};

	for ( const [ key, handler ] of Object.entries( mergedHandlers ) ) {
		if ( typeof extraHandlers[ key ] === 'function' ) {
			// @ts-ignore
			mergedHandlers[ key as keyof typeof mergedHandlers ] = mergeEvent(
				handler,
				extraHandlers[ key ]
			);
		}
	}

	for ( const [ key, handler ] of Object.entries( extraHandlers ) ) {
		if ( key in mergedHandlers ) {
			continue;
		}
		// @ts-ignore
		mergedHandlers[ key ] = handler;
	}

	return mergedHandlers;
}
