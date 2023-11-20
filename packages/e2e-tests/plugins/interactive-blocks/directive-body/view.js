( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		actions: {
			toggleText: ( { context } ) => {
				context.text = context.text === 'text-1' ? 'text-2' : 'text-1';
			},
		},
	} );
} )( window );
