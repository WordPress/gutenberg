require( 'core-js/modules/es7.object.values' );

// Chai plugins
require( 'chai' )
	.use( require( 'dirty-chai' ) )
	.use( require( 'sinon-chai' ) );

// Sinon plugins
const sinon = require( 'sinon' );
const sinonTest = require( 'sinon-test' );
sinon.test = sinonTest.configureTest( sinon );
sinon.testCase = sinonTest.configureTestCase( sinon );

// Make sure we can share test helpers between Mocha and Jest
global.after = global.afterAll;
global.before = global.beforeAll;
global.context = global.describe;
