// Chai plugins
require( 'chai' )
	.use( require( 'dirty-chai' ) )
	.use( require( 'sinon-chai' ) );

// Fake DOM
global.document = require( 'jsdom' ).jsdom( '', {
	features: {
		FetchExternalResources: false,
		ProcessExternalResources: false,
		SkipExternalResources: true,
	},
} );
global.window = document.defaultView;
global.requestAnimationFrame = setTimeout;
global.navigator = window.navigator;

// These are necessary to load TinyMCE successfully
global.URL = window.URL;
global.window.tinyMCEPreInit = {
	// Without this, TinyMCE tries to determine its URL by looking at the
	// <script> tag where it was loaded from, which of course fails here.
	baseURL: 'about:blank',
};
