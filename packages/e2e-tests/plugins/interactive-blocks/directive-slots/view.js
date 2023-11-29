( ( { wp } ) => {
	const { store, getContext } = wp.interactivity;

	const { state } = store( 'directive-slots', {
		state: {
			slot: ''
		},
		actions: {
			changeSlot( event ) {
				state.slot = event.target.dataset.slot;
			},
			updateSlotText() {
				const context = getContext();
				const n = context.text[1];
				context.text = `[${n} updated]`;
			},
		},
	} );
} )( window );
