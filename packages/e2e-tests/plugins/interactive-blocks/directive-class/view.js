( ( { wp } ) => {
	const { store, getContext } = wp.interactivity;

	const { state } = store( "directive-class", {
		state: {
			trueValue: true,
			falseValue: false,
		},
		actions: {
			toggleTrueValue: () => {
				state.trueValue = ! state.trueValue;
			},
			toggleFalseValue: () => {
				state.falseValue = ! state.falseValue;
			},
			toggleContextFalseValue: () => {
				const context = getContext();
				context.falseValue = ! context.falseValue;
			},
		},
	} );
} )( window );
