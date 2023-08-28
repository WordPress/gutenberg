( ( { wp } ) => {
	/**
	 * WordPress dependencies
	 */
	const { store, navigate } = wp.interactivity;

	store( {
		state: {
			region1: {
				text: 'hydrated'
			},
			region2: {
				text: 'hydrated'
			},
			counter: {
				value: 0,
			},
		},
		actions: {
			router: {
				navigate: async ( { event: e } ) => {
					e.preventDefault();
					await navigate( e.target.href );
				},
				back: () => history.back(),
			},
			counter: {
				increment: ( { state, context } ) => {
					if ( context.counter ) {
						context.counter.value += 1;
					} else {
						state.counter.value += 1;
					}
				},
				init: ( { context } ) => {
					if ( context.counter ) {
						context.counter.value = context.counter.initialValue;
					}
				}
			},
		},
	} );
} )( window );
