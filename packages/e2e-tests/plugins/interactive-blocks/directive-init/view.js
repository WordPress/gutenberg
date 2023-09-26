( ( { wp } ) => {
	const { store, directive, useContext } = wp.interactivity;

	// Mock `data-wp-show` directive to test when things are removed from the
	// DOM.  Replace with `data-wp-show` when it's ready.
	directive(
		'show-mock',
		( {
			directives: {
				'show-mock': { default: showMock },
			},
			element,
			evaluate,
			context,
		} ) => {
			const contextValue = useContext( context );
			if ( ! evaluate( showMock, { context: contextValue } ) ) {
				return null;
			}
			return element;
		}
	);


	store( {
		selector: {
			isReady: ({ context: { isReady } }) => {
				return isReady
				.map(v => v ? 'true': 'false')
				.join(',');
			},
			calls: ({ context: { calls } }) => {
				return calls.join(',');
			},
			isMounted: ({ context }) => {
				return context.isMounted ? 'true' : 'false';
			},
		},
		actions: {
			initOne: ( { context: { isReady, calls } } ) => {
				isReady[0] = true;
				// Subscribe to changes in that prop.
				isReady[0] = isReady[0];
				calls[0]++;
			},
			initTwo: ( { context: { isReady, calls } } ) => {
				isReady[1] = true;
				calls[1]++;
			},
			initMount: ( { context } ) => {
				context.isMounted = true;
				return () => {
					context.isMounted = false;
				}
			},
			reset: ( { context: { isReady } } ) => {
				isReady.fill(false);
			},
			toggle: ( { context } ) => {
				context.isVisible = ! context.isVisible;
			},
		},
	} );
} )( window );
