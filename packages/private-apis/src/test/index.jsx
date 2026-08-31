import fs from 'fs';
import path from 'path';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '../';
import {
	resetAllowedCoreModules,
	allowCoreModule,
	resetWarnedDeprecatedModules,
	DEPRECATED_CORE_MODULES,
} from '../implementation';

// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @wordpress/wp-global-usage */

beforeEach( () => {
	resetAllowedCoreModules();
	allowCoreModule( '@privateApis/test' );
	allowCoreModule( '@privateApis/test-consumer' );
} );

const requiredConsent =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

describe( '__dangerousOptInToUnstableAPIsOnlyForCoreModules', () => {
	it( 'Should require a consent string', () => {
		expect( () => {
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				'',
				'@privateApis/test'
			);
		} ).toThrow( /without confirming you know the consequences/ );
	} );
	it( 'Should require a valid @wordpress package name', () => {
		expect( () => {
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'custom_package'
			);
		} ).toThrow(
			/This feature is only for JavaScript modules shipped with WordPress core/
		);
	} );

	it( 'Should grant access to unstable APIs when passed both a consent string and a previously unregistered package name', () => {
		const unstableAPIs = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@privateApis/test'
		);
		expect( unstableAPIs.lock ).toEqual( expect.any( Function ) );
		expect( unstableAPIs.unlock ).toEqual( expect.any( Function ) );
	} );
} );

describe( 'lock(), unlock()', () => {
	let lock, unlock;
	beforeEach( () => {
		// This would live in @privateApis/test:
		// Opt-in to private APIs
		const privateApisAPI = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@privateApis/test'
		);
		lock = privateApisAPI.lock;
		unlock = privateApisAPI.unlock;
	} );

	it( 'Should lock and unlock objects "inside" other objects', () => {
		const object = {};
		const privateData = { secret: 'sh' };
		lock( object, privateData );
		expect( unlock( object ).secret ).toBe( 'sh' );
	} );

	it( 'Should lock and unlock functions "inside" objects', () => {
		const object = {};
		const privateData = () => 'sh';
		lock( object, privateData );
		expect( unlock( object )() ).toBe( 'sh' );
	} );

	it( 'Should lock and unlock strings "inside" objects', () => {
		const object = {};
		const privateData = 'sh';
		lock( object, privateData );
		expect( unlock( object ) ).toBe( 'sh' );
	} );

	it( 'Should lock and unlock objects "inside" functions', () => {
		const fn = function () {};
		const privateData = { secret: 'sh' };
		lock( fn, privateData );
		expect( unlock( fn ).secret ).toBe( 'sh' );
	} );

	it( 'Should lock and unlock functions "inside" other functions', () => {
		const fn = function () {};
		const privateData = () => 'sh';
		lock( fn, privateData );
		expect( unlock( fn )() ).toBe( 'sh' );
	} );

	it( 'Should lock and unlock strings "inside"  functions', () => {
		const fn = function () {};
		const privateData = 'sh';
		lock( fn, privateData );
		expect( unlock( fn ) ).toBe( 'sh' );
	} );

	it( 'Should grant other opt-int modules access to locked objects', () => {
		const object = {};
		const privateData = { secret: 'sh' };
		lock( object, privateData );

		// This would live in @wordpress/core-data:
		// Register the private APIs
		const coreDataPrivateApis =
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@privateApis/test-consumer'
			);

		// Get the private APIs registered by @privateApis/test
		expect( coreDataPrivateApis.unlock( object ).secret ).toBe( 'sh' );
	} );
} );

describe( 'Specific use-cases of sharing private APIs', () => {
	let lock, unlock;
	beforeEach( () => {
		// This would live in @privateApis/test:
		// Opt-in to private APIs
		const privateApisAPI = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@privateApis/test'
		);
		lock = privateApisAPI.lock;
		unlock = privateApisAPI.unlock;
	} );

	it( 'Should enable privately exporting private functions', () => {
		/**
		 * Problem: The private __privateFunction should not be publicly
		 * exposed to the consumers of package1.
		 */
		function __privateFunction() {}
		/**
		 * Solution: Privately lock it inside a publicly exported object.
		 *
		 * In `package1/index.js` we'd say:
		 *
		 * ```js
		 * export const privateApis = {};
		 * lock(privateApis, {
		 *     __privateFunction
		 * });
		 * ```
		 *
		 * Let's simulate in the test code:
		 */
		const privateApis = {};
		const package1Exports = {
			privateApis,
		};
		lock( privateApis, { __privateFunction } );

		/**
		 * Then, in the consumer package we'd say:
		 *
		 * ```js
		 * import { privateApis } from 'package1';
		 * const { __privateFunction } = unlock( privateApis );
		 * ```
		 *
		 * Let's simulate that, too:
		 */
		const unlockedFunction = unlock(
			package1Exports.privateApis
		).__privateFunction;
		expect( unlockedFunction ).toBe( __privateFunction );
	} );

	it( 'Should enable exporting functions with private private arguments', () => {
		/**
		 * The publicly exported function does not have any private
		 * arguments.
		 *
		 * @param {any} data The data to log
		 */
		function logData( data ) {
			// Internally, it calls the private version of the function
			// with fixed default values for the private arguments.
			__privateLogData( data, 'plain' );
		}
		/**
		 * The private private function is not publicly exported. Instead, it's
		 * "locked" inside of the public logData function. It can be unlocked by any
		 * participant of the private importing system.
		 *
		 * @param {any}    data            The data to log
		 * @param {string} __privateFormat The logging format to use.
		 */
		function __privateLogData( data, __privateFormat ) {
			if ( __privateFormat === 'table' ) {
				// eslint-disable-next-line no-console
				console.table( data );
			} else {
				// eslint-disable-next-line no-console
				console.log( data );
			}
		}
		lock( logData, __privateLogData );
		/**
		 * In package/log-data.js:
		 *
		 * ```js
		 * lock( logData, __privateLogData );
		 * export logData;
		 * ```
		 *
		 * Then, in package/index.js:
		 *
		 * ```js
		 * export { logData } from './log-data';
		 * ```
		 *
		 * And that's it! The public function is publicly exported, and the
		 * private function is available via unlock( logData ):
		 *
		 * ```js
		 * import { logData } from 'package1';
		 * const experimentalLogData = unlock( logData );
		 * ```
		 */
		expect( unlock( logData ) ).toBe( __privateLogData );
	} );

	it( 'Should enable exporting React Components with private private properties', () => {
		// eslint-disable-next-line jsdoc/require-param
		/**
		 * The publicly exported component does not have any private
		 * properties.
		 */
		function DataTable( { data } ) {
			// Internally, it calls the private version of the function
			// with fixed default values for the private arguments.
			return (
				<PrivateDataTable
					data={ data }
					__privateFancyFormatting={ false }
				/>
			);
		}
		// eslint-disable-next-line jsdoc/require-param
		/**
		 * The private private component is not publicly exported. Instead, it's
		 * "locked" inside of the public logData function. It can be unlocked by any
		 * participant of the private importing system.
		 */
		function PrivateDataTable( { data, __privateFancyFormatting } ) {
			const className = __privateFancyFormatting
				? 'savage-css'
				: 'regular-css';
			return (
				<table className={ className }>
					{ data.map( ( row, i ) => (
						<tr key={ i }>
							{ row.map( ( col, j ) => (
								<td key={ j }>{ col }</td>
							) ) }
						</tr>
					) ) }
				</table>
			);
		}
		lock( DataTable, PrivateDataTable );
		/**
		 * In package/data-table.js:
		 *
		 * ```js
		 * lock( DataTable, PrivateDataTable );
		 * export DataTable;
		 * ```
		 *
		 * Then, in package/index.js:
		 *
		 * ```js
		 * export { DataTable } from './data-table';
		 * ```
		 *
		 * And that's it! The public function is publicly exported, and the
		 * private function is available via unlock( logData ):
		 *
		 * ```js
		 * import { DataTable } from 'package1';
		 * const PrivateDataTable = unlock( DataTable );
		 * ```
		 */
		expect( unlock( DataTable ) ).toBe( PrivateDataTable );
	} );
} );

describe( 'Deprecated core modules', () => {
	const initialScriptDebug = globalThis.SCRIPT_DEBUG;

	beforeEach( () => {
		globalThis.SCRIPT_DEBUG = true;
		resetWarnedDeprecatedModules();
	} );

	afterEach( () => {
		globalThis.SCRIPT_DEBUG = initialScriptDebug;
	} );

	it( 'Should grant access to unstable APIs and log a deprecation warning', () => {
		const unstableAPIs = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@wordpress/dataviews'
		);
		expect( console ).toHaveWarned();
		expect( unstableAPIs.lock ).toEqual( expect.any( Function ) );
		expect( unstableAPIs.unlock ).toEqual( expect.any( Function ) );
	} );

	it( 'Should still require the consent string', () => {
		expect( () => {
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				'',
				'@wordpress/dataviews'
			);
		} ).toThrow( /without confirming you know the consequences/ );
	} );

	it( 'Should log the deprecation warning only once per module', () => {
		__dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@wordpress/dataviews'
		);
		__dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@wordpress/dataviews'
		);
		expect( console ).toHaveWarned();
		// eslint-disable-next-line no-console
		expect( console.warn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'Should not log a deprecation warning when SCRIPT_DEBUG is disabled', () => {
		globalThis.SCRIPT_DEBUG = false;
		const unstableAPIs = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@wordpress/dataviews'
		);
		expect( unstableAPIs.lock ).toEqual( expect.any( Function ) );
	} );

	it( 'Should be removed when the WordPress version scheduled for their removal is reached', () => {
		// The newest lib/compat/wordpress-X.Y directory marks the WordPress
		// release Gutenberg is currently targeting.
		const compatDir = path.join( __dirname, '../../../../lib/compat' );
		const targetedVersion = fs
			.readdirSync( compatDir )
			.map( ( name ) => name.match( /^wordpress-(\d+)\.(\d+)$/ ) )
			.filter( Boolean )
			.map( ( match ) => [ Number( match[ 1 ] ), Number( match[ 2 ] ) ] )
			.sort( ( a, b ) => a[ 0 ] - b[ 0 ] || a[ 1 ] - b[ 1 ] )
			.pop();

		const dueForRemoval = [];
		for ( const [ moduleName, { removal } ] of Object.entries(
			DEPRECATED_CORE_MODULES
		) ) {
			const [ major, minor ] = removal.split( '.' ).map( Number );
			const isReached =
				targetedVersion[ 0 ] > major ||
				( targetedVersion[ 0 ] === major &&
					targetedVersion[ 1 ] >= minor );
			if ( isReached ) {
				dueForRemoval.push(
					`The "${ moduleName }" entry in DEPRECATED_CORE_MODULES was scheduled ` +
						`for removal in WordPress ${ removal }, and the ` +
						`${ targetedVersion[ 0 ] }.${ targetedVersion[ 1 ] } release cycle has started. ` +
						`Remove the entry and its deprecation warning, unless old copies of the ` +
						`module are still in significant use by plugins.`
				);
			}
		}
		expect( dueForRemoval ).toEqual( [] );
	} );
} );
