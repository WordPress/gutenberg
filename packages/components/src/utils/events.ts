type EventHandler< T extends Event > = ( event: T ) => void;

/**
 * Merges event handlers together.
 *
 * @template TEvent
 * @param    handler
 * @param    otherHandler
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
 * Merges two sets of event handlers together.
 *
 * @template TEvent
 * @param    handlers
 * @param    extraHandlers
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

	for ( const [ key, handler ] of Object.entries( extraHandlers ) ) {
		// @ts-ignore
		mergedHandlers[ key as keyof typeof mergedHandlers ] =
			key in mergedHandlers
				? mergeEvent( mergedHandlers[ key ], handler )
				: handler;
	}

	return mergedHandlers;
}
