// Chai plugins
require( 'chai' )
	.use( require( 'dirty-chai' ) )
	.use( require( 'sinon-chai' ) );

// Sinon plugins
const sinon = require( 'sinon' );
const sinonTest = require( 'sinon-test' );
sinon.test = sinonTest.configureTest( sinon );
sinon.testCase = sinonTest.configureTestCase( sinon );

// Fake DOM
const { JSDOM } = require( 'jsdom' );
const dom = new JSDOM( '', {
	features: {
		FetchExternalResources: false,
		ProcessExternalResources: false,
		SkipExternalResources: true,
	},
} );

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = window.setTimeout;

require( './test/setup-globals' );
