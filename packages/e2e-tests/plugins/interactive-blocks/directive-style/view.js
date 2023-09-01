( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		state: {
			falseValue: false,
			color: "red",
			border: "2px solid yellow"
		},
		actions: {
			toggleColor: ( { state } ) => {
				state.color = state.color === "red" ? "blue" : "red";
			},
			switchColorToFalse: ({ state }) => {
				state.color = false;
			},
			toggleContext: ( { context } ) => {
				context.color = context.color === "red" ? "blue" : "red";
			},
		},
	} );
} )( window );
