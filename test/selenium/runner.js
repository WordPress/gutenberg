const path = require( 'path' );
const fs = require( 'fs' );
const { camelCase, mapKeys, merge, pickBy } = require( 'lodash' );
const { Builder } = require( 'selenium-webdriver' );

const defaultConfig = {
	baseUrl: 'http://localhost:8888',
	username: 'admin',
	password: 'password',
	browser: 'chrome',
};

const fileConfig = require( './config.json' );

const envConfig = mapKeys(
	pickBy( process.env, ( value, key ) => /^test_/.test( key ) ),
	( value, key ) => camelCase( key.replace( /^test_/, '' ) ) );

const config = merge( defaultConfig, fileConfig, envConfig );

const driver = new Builder().forBrowser( config.browser ).build();

const testFolder = 'integration';
const normalizedPath = path.join( __dirname, testFolder );
describe( 'Integration Tests', function() {
	this.timeout( 5000 );

	after( () => {
		driver.close();
	} );

	fs.readdirSync( normalizedPath ).forEach( function( file ) {
		require( './' + testFolder + '/' + file ).run( config, driver );
	} );
} );

