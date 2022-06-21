/**
 * Internal dependencies
 */
import config from '../lib/';

const isPlainObject = ( obj ) => {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		obj.constructor === Object &&
		Object.prototype.toString.call( obj ) === '[object Object]'
	);
};

describe( 'prettier config tests', () => {
	it( 'should be an object', () => {
		expect( isPlainObject( config ) ).toBeTruthy();
	} );
} );
