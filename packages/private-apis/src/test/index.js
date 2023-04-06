/**
 * Internal dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '../';
import {
	resetRegisteredPrivateApis,
	resetAllowedCoreModules,
	allowCoreModule,
} from '../implementation';

beforeEach( () => {
	resetRegisteredPrivateApis();
	resetAllowedCoreModules();
	allowCoreModule( '@privateApis/test' );
	allowCoreModule( '@privateApis/test-consumer' );
} );

const requiredConsent =
	'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.';

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
	it( 'Should not register the same module twice', () => {
		expect( () => {
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@privateApis/test'
			);
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@privateApis/test'
			);
		} ).toThrow( /is already registered/ );
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
		 * const experimenalLogData = unlock( logData );
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
