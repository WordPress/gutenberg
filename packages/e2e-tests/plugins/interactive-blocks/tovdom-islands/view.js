( ( { wp } ) => {
	const { store, directive, createElement } = wp.interactivity;

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
			if ( ! evaluate( showMock ) )
				element.props.children =
					createElement( "template", null, element.props.children );
		}
	);

	store( {
		state: {
			falseValue: false,
		},
	} );
} )( window );
