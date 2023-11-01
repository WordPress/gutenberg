( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		state: {
			trueValue: true,
			falseValue: false,
		},
		actions: {
			toggleTrueValue: ( { state } ) => {
				state.trueValue = ! state.trueValue;
			},
			toggleFalseValue: ( { state } ) => {
				state.falseValue = ! state.falseValue;
			},
			toggleContextFalseValue: ( { context } ) => {
				context.falseValue = ! context.falseValue;
			},
		},
	} );
} )( window );
