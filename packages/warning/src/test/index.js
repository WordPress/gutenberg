/**
 * Internal dependencies
 */
import warning from '..';
import { logged } from '../utils';

// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @wordpress/wp-global-usage */

describe( 'warning', () => {
	const initialScriptDebug = globalThis.SCRIPT_DEBUG;

	afterEach( () => {
		globalThis.SCRIPT_DEBUG = initialScriptDebug;
		logged.clear();
	} );

	it( 'logs to console.warn when SCRIPT_DEBUG is set to `true`', () => {
		globalThis.SCRIPT_DEBUG = true;
		warning( 'warning' );
		expect( console ).toHaveWarnedWith( 'warning' );
	} );

	it( 'does not log to console.warn if SCRIPT_DEBUG not set to `true`', () => {
		globalThis.SCRIPT_DEBUG = false;
		warning( 'warning' );
		expect( console ).not.toHaveWarned();
	} );

	it( 'should show a message once', () => {
		globalThis.SCRIPT_DEBUG = true;
		warning( 'warning' );
		warning( 'warning' );

		expect( console ).toHaveWarned();
		// eslint-disable-next-line no-console
		expect( console.warn ).toHaveBeenCalledTimes( 1 );
	} );
} );
