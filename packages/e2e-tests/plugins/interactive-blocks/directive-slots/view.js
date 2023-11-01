( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		state: {
			slot: ''
		},
		actions: {
			changeSlot: ( { state, event } ) => {
				state.slot = event.target.dataset.slot;
			},
			updateSlotText: ( { context } ) => {
				const n = context.text[1];
				context.text = `[${n} updated]`;
			},
		},
	} );
} )( window );
