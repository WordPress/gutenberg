/**
 * WordPress dependencies
 */
import { store, getContext, directive, withScope } from '@wordpress/interactivity';


directive( 'async-mock', ( { directives: { 'async-mock': asyncMock }, element, evaluate } ) => {
	const entry = asyncMock.find( ( { suffix } ) => suffix === 'default' );
	// Create an async directive function.
	try {
		element.textContent = 'running async directive...';
		return withScope(evaluate( entry ));
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.log( 'error', e );
	}
} );


store( 'with-scope', {
	state: {
		asyncText: 'hi async',
	},
	callbacks: {
		keydownHandler: ( ) => {
			const context = getContext();
			context.counter += 1;
		},
		sampleAsyncFunction: async() => {
            const context = getContext();
            // simulate a delay with Promise and setTimeout
            await new Promise(resolve => setTimeout(resolve, 1000));
			context.counter += 1;
        },
	},
} );
