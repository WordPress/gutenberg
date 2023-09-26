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
				timeout: 10000,
			}
		},
		actions: {
			router: {
				navigate: async ( { state, event: e } ) => {
					e.preventDefault();

					state.router.navigations += 1;
					state.router.status = 'busy';

					const force = e.target.dataset.forceNavigation === 'true';
					const { timeout } = state.router;

					await navigate( e.target.href, { force, timeout } );

					state.router.navigations -= 1;

					if ( state.router.navigations === 0) {
						state.router.status = 'idle';
					}
				},
				toggleTimeout: ( { state }) => {
					state.router.timeout =
						state.router.timeout === 10000 ? 0 : 10000;
				}
			},
		},
	} );
} )( window );
