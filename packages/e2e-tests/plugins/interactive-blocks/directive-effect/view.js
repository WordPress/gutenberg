( ( { wp } ) => {
	const { store, directive } = wp.interactivity;

	// Fake `data-wp-show-mock` directive to test when things are removed from the
	// DOM.  Replace with `data-wp-show` when it's ready.
	directive(
		'show-mock',
		( {
			directives: {
				"show-mock": { default: showMock },
			},
			element,
			evaluate,
		} ) => {
			if ( ! evaluate( showMock ) ) return null;
			return element;
		}
	);

	store( {
		state: {
			isOpen: true,
			isElementInTheDOM: false,
			counter: 0,
		},
		selectors: {
			elementInTheDOM: ( { state } ) =>
				state.isElementInTheDOM
					? 'element is in the DOM'
					: 'element is not in the DOM',
		},
		actions: {
			toggle( { state } ) {
				state.isOpen = ! state.isOpen;
			},
			increment( { state } ) {
				state.counter = state.counter + 1;
			},
		},
		effects: {
			elementAddedToTheDOM: ( { state } ) => {
				state.isElementInTheDOM = true;

				return () => {
					state.isElementInTheDOM = false;
				};
			},
			changeFocus: ( { state } ) => {
				if ( state.isOpen ) {
					document.querySelector( "[data-testid='input']" ).focus();
				}
			},
			infiniteLoop: ({ state }) => {
				state.counter = state.counter + 1;
			}
		},
	} );

} )( window );
