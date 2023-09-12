/**
 * Internal dependencies
 */
import warning from '..';
import { logged } from '../utils';

describe( 'warning', () => {
	const initialScriptDebug = global.SCRIPT_DEBUG;

	afterEach( () => {
		global.SCRIPT_DEBUG = initialScriptDebug;
		logged.clear();
	} );

	it( 'logs to console.warn when SCRIPT_DEBUG is set to `true`', () => {
		global.SCRIPT_DEBUG = true;
		warning( 'warning' );
		expect( console ).toHaveWarnedWith( 'warning' );
	} );

	it( 'does not log to console.warn if SCRIPT_DEBUG not set to `true`', () => {
		global.SCRIPT_DEBUG = false;
		warning( 'warning' );
		expect( console ).not.toHaveWarned();
	} );

	it( 'should show a message once', () => {
		global.SCRIPT_DEBUG = true;
		warning( 'warning' );
		warning( 'warning' );

		expect( console ).toHaveWarned();
		// eslint-disable-next-line no-console
		expect( console.warn ).toHaveBeenCalledTimes( 1 );
	} );
} );
