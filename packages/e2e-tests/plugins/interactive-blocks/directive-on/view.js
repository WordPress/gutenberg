( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		state: {
			counter: 0,
			text: ''
		},
		actions: {
			clickHandler: ( { state, event } ) => {
				state.counter += 1;
				event.target.dispatchEvent(
					new CustomEvent( 'customevent', { bubbles: true } )
				);
			},
			inputHandler: ( { state, event } ) => {
				state.text = event.target.value;
			},
			selectHandler: ( { context, event } ) => {
				context.option = event.target.value;
			},
			customEventHandler: ({ context }) => {
				context.customEvents += 1;
			},
		},
	} );
} )( window );
