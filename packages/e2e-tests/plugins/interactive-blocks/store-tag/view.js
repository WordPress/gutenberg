( ( { wp } ) => {
	/**
	 * WordPress dependencies
	 */
	const { store } = wp.interactivity;

	store( {
		state: {
			counter: {
				// `value` is defined in the server.
				double: ( { state } ) => state.counter.value * 2,
				clicks: 0,
			},
		},
		actions: {
			counter: {
				increment: ( { state } ) => {
					state.counter.value += 1;
					state.counter.clicks += 1;
				},
			},
		},
	} );
} )( window );
