( ( { wp } ) => {
	const { store } = wp.interactivity;

	store( {
		derived: {
			renderContext: ( { context } ) => {
				return JSON.stringify( context, undefined, 2 );
			},
		},
		actions: {
			updateContext: ( { context, event } ) => {
				const { name, value } = event.target;
				const [ key, ...path ] = name.split( '.' ).reverse();
				const obj = path.reduceRight( ( o, k ) => o[ k ], context );
				obj[ key ] = value;
			},
			toggleContextText: ( { context } ) => {
				context.text = context.text === 'Text 1' ? 'Text 2' : 'Text 1';
			},
		},
	} );
} )( window );
