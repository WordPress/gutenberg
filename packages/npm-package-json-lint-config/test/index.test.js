/**
 * Internal dependencies
 */
import config from '../';

const isPlainObject = ( obj ) => {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		obj.constructor === Object &&
		Object.prototype.toString.call( obj ) === '[object Object]'
	);
};

describe( 'npm-package-json-lint config tests', () => {
	it( 'should be an object', () => {
		expect( isPlainObject( config ) ).toBeTruthy();
	} );

	it( 'should have rules property as an object', () => {
		expect( isPlainObject( config.rules ) ).toBeTruthy();
	} );
} );
