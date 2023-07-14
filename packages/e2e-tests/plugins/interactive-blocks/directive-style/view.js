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
			toggleBorder: ( { state } ) => {
				state.color = state.color === "2px solid yellow" ? "1px solid black" : "2px solid yellow";
			},
			toggleContext: ( { context } ) => {
				context.color = context.color === "red" ? "blue" : "red";
			},
		},
	} );
} )( window );
