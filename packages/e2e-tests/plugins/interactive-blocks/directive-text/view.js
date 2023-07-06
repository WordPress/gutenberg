( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		state: {
			text: 'Text 1',
		},
		actions: {
			toggleStateText: ( { state } ) => {
				state.text = state.text === 'Text 1' ? 'Text 2' : 'Text 1';
			},
			toggleContextText: ( { context } ) => {
				context.text = context.text === 'Text 1' ? 'Text 2' : 'Text 1';
			},
		},
	} );
} )( window );
