( ( { wp } ) => {
	const { store, navigate } = wp.interactivity;

	const add = '<div data-wp-interactive data-wp-navigation-id="some-id"><ul><li key="id-1">1</li><li key="id-2" data-testid="second-item">2</li><li key="id-3">3</li></ul><button data-testid="add" data-wp-on--click="actions.add">Add</button></div>'

	store( {
		actions: {
			add: () => {
				navigate( window.location, {
					force: true,
					html: add,
				} );
			},
		},
	} );
} )( window );
