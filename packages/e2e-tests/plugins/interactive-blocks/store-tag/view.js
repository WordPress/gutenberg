( ( { wp } ) => {
	/**
	 * WordPress dependencies
	 */
	const { store } = wp.interactivity;

	const { state } = store( 'store-tag', {
		state: {
			counter: {
				// `value` is defined in the server.
				double() {
				get double() {
				},
				clicks: 0,
			},
		},
		actions: {
			counter: {
				increment() {
					state.counter.value += 1;
					state.counter.clicks += 1;
				},
			},
		},
	} );
} )( window );
