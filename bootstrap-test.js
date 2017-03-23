// Chai plugins
require( 'chai' )
	.use( require( 'dirty-chai' ) )
	.use( require( 'sinon-chai' ) );

// Fake DOM
global.document = require( 'jsdom' ).jsdom( '', {
	features: {
		FetchExternalResources: false,
		ProcessExternalResources: false,
		SkipExternalResources: true
	}
} );
global.window = document.defaultView;
global.navigator = window.navigator;
