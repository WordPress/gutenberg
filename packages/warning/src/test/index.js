/**
 * Internal dependencies
 */
import warning from '..';
import { logged } from '../utils';

const initialNodeEnv = process.env.NODE_ENV;

describe( 'warning', () => {
	afterEach( () => {
		process.env.NODE_ENV = initialNodeEnv;
		logged.clear();
	} );

	it( 'logs to console.warn when NODE_ENV is not "production"', () => {
		process.env.NODE_ENV = 'development';
		warning( 'warning' );
		expect( console ).toHaveWarnedWith( 'warning' );
	} );

	it( 'does not log to console.warn if NODE_ENV is "production"', () => {
		process.env.NODE_ENV = 'production';
		warning( 'warning' );
		expect( console ).not.toHaveWarned();
	} );

	it( 'should show a message once', () => {
		warning( 'warning' );
		warning( 'warning' );

		expect( console ).toHaveWarned();
		// eslint-disable-next-line no-console
		expect( console.warn ).toHaveBeenCalledTimes( 1 );
	} );
} );
