( ( { wp } ) => {
	/**
	 * WordPress dependencies
	 */
	const { store, navigate } = wp.interactivity;

	store( {
		state: {
			router: {
				status: 'idle',
				navigations: 0,
			}
		},
		actions: {
			router: {
				navigate: async ( { state, event: e } ) => {
					e.preventDefault();

					state.router.navigations += 1;
					state.router.status = 'busy';

					await navigate( e.target.href );

					state.router.navigations -= 1;

					if ( state.router.navigations === 0) {
						state.router.status = 'idle';
					}
				},
			},
		},
	} );
} )( window );
