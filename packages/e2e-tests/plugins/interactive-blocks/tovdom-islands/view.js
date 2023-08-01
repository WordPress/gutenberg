( ( { wp } ) => {
	const { store, directive, createElement } = wp.interactivity;

	// Fake `data-wp-fakeshow` directive to test when things are removed from the
	// DOM.  Replace with `data-wp-show` when it's ready.
	directive(
		'fakeshow',
		( {
			directives: {
				fakeshow: { default: fakeshow },
			},
			element,
			evaluate,
		} ) => {
			if ( ! evaluate( fakeshow ) )
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
