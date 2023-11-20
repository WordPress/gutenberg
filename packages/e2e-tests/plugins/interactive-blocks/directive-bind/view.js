( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		state: {
			url: '/some-url',
			checked: true,
			show: false,
			width: 1,
		},
		foo: {
			bar: 1,
		},
		actions: {
			toggle: ( { state, foo } ) => {
				state.url = '/some-other-url';
				state.checked = ! state.checked;
				state.show = ! state.show;
				state.width += foo.bar;
			},
			toggleValue: ( { context } ) => {
				const previousValue = ( 'previousValue' in context )
					? context.previousValue
					// Any string works here; we just want to toggle the value
					// to ensure Preact renders the same we are hydrating in the
					// first place.
					: 'tacocat';

				context.previousValue = context.value;
				context.value = previousValue;
			}
		},
	} );
} )( window );
