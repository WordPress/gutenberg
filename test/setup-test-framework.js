// `babel-jest` should be doing this instead, but apparently it's not working.
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
