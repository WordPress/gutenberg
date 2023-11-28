( ( { wp } ) => {
	const { store, getContext } = wp.interactivity;

	store( 'directive-body', {
		actions: {
			toggleText: () => {
				const context = getContext();
				context.text = context.text === 'text-1' ? 'text-2' : 'text-1';
			},
		},
	} );
} )( window );
