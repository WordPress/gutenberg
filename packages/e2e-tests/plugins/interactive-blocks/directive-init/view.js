( ( { wp } ) => {
	const { store, directive, useContext, useMemo } = wp.interactivity;

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
			const children = useMemo(
				() =>
					element.type === 'template'
						? element.props.templateChildren
						: element,
				[]
			);
			if ( ! evaluate( showMock, { context: contextValue } ) ) {
				return null;
			}
			return children;
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
