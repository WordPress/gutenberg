/**
 * Internal dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '../';
import {
	resetRegisteredExperiments,
	resetAllowedCoreModules,
	allowCoreModule,
} from '../implementation';

beforeEach( () => {
	resetRegisteredExperiments();
	resetAllowedCoreModules();
	allowCoreModule( '@experiments/test' );
	allowCoreModule( '@experiments/test-consumer' );
} );

const requiredConsent =
	'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.';

describe( '__dangerousOptInToUnstableAPIsOnlyForCoreModules', () => {
	it( 'Should require a consent string', () => {
		expect( () => {
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				'',
				'@experiments/test'
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
				'@experiments/test'
			);
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@experiments/test'
			);
		} ).toThrow( /is already registered/ );
	} );
	it( 'Should grant access to unstable APIs when passed both a consent string and a previously unregistered package name', () => {
		const unstableAPIs = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@experiments/test'
		);
		expect( unstableAPIs.lock ).toEqual( expect.any( Function ) );
		expect( unstableAPIs.unlock ).toEqual( expect.any( Function ) );
	} );
} );

describe( 'lock(), unlock()', () => {
	let lock, unlock;
	beforeEach( () => {
		// This would live in @experiments/test:
		// Opt-in to experimental APIs
		const experimentsAPI = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@experiments/test'
		);
		lock = experimentsAPI.lock;
		unlock = experimentsAPI.unlock;
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
		// Register the experimental APIs
		const coreDataExperiments =
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@experiments/test-consumer'
			);

		// Get the experimental APIs registered by @experiments/test
		expect( coreDataExperiments.unlock( object ).secret ).toBe( 'sh' );
	} );
} );

describe( 'Specific use-cases of sharing private APIs', () => {
	let lock, unlock;
	beforeEach( () => {
		// This would live in @experiments/test:
		// Opt-in to experimental APIs
		const experimentsAPI = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@experiments/test'
		);
		lock = experimentsAPI.lock;
		unlock = experimentsAPI.unlock;
	} );

	it( 'Should enable privately exporting experimental functions', () => {
		/**
		 * Problem: The private __experimentalFunction should not be publicly
		 * exposed to the consumers of package1.
		 */
		function __experimentalFunction() {}
		/**
		 * Solution: Privately lock it inside a publicly exported object.
		 *
		 * In `package1/index.js` we'd say:
		 *
		 * ```js
		 * export const experiments = {};
		 * lock(experiments, {
		 *     __experimentalFunction
		 * });
		 * ```
		 *
		 * Let's simulate in the test code:
		 */
		const experiments = {};
		const package1Exports = {
			experiments,
		};
		lock( experiments, { __experimentalFunction } );

		/**
		 * Then, in the consumer package we'd say:
		 *
		 * ```js
		 * import { experiments } from 'package1';
		 * const { __experimentalFunction } = unlock( experiments );
		 * ```
		 *
		 * Let's simulate that, too:
		 */
		const unlockedFunction = unlock(
			package1Exports.experiments
		).__experimentalFunction;
		expect( unlockedFunction ).toBe( __experimentalFunction );
	} );

	it( 'Should enable exporting functions with private experimental arguments', () => {
		/**
		 * The publicly exported function does not have any experimental
		 * arguments.
		 *
		 * @param {any} data The data to log
		 */
		function logData( data ) {
			// Internally, it calls the experimental version of the function
			// with fixed default values for the experimental arguments.
			__experimentalLogData( data, 'plain' );
		}
		/**
		 * The private experimental function is not publicly exported. Instead, it's
		 * "locked" inside of the public logData function. It can be unlocked by any
		 * participant of the private importing system.
		 *
		 * @param {any}    data                 The data to log
		 * @param {string} __experimentalFormat The logging format to use.
		 */
		function __experimentalLogData( data, __experimentalFormat ) {
			if ( __experimentalFormat === 'table' ) {
				// eslint-disable-next-line no-console
				console.table( data );
			} else {
				// eslint-disable-next-line no-console
				console.log( data );
			}
		}
		lock( logData, __experimentalLogData );
		/**
		 * In package/log-data.js:
		 *
		 * ```js
		 * lock( logData, __experimentalLogData );
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
		 * experimental function is available via unlock( logData ):
		 *
		 * ```js
		 * import { logData } from 'package1';
		 * const experimenalLogData = unlock( logData );
		 * ```
		 */
		expect( unlock( logData ) ).toBe( __experimentalLogData );
	} );

	it( 'Should enable exporting React Components with private experimental properties', () => {
		// eslint-disable-next-line jsdoc/require-param
		/**
		 * The publicly exported component does not have any experimental
		 * properties.
		 */
		function DataTable( { data } ) {
			// Internally, it calls the experimental version of the function
			// with fixed default values for the experimental arguments.
			return (
				<ExperimentalDataTable
					data={ data }
					__experimentalFancyFormatting={ false }
				/>
			);
		}
		// eslint-disable-next-line jsdoc/require-param
		/**
		 * The private experimental component is not publicly exported. Instead, it's
		 * "locked" inside of the public logData function. It can be unlocked by any
		 * participant of the private importing system.
		 */
		function ExperimentalDataTable( {
			data,
			__experimentalFancyFormatting,
		} ) {
			const className = __experimentalFancyFormatting
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
		lock( DataTable, ExperimentalDataTable );
		/**
		 * In package/data-table.js:
		 *
		 * ```js
		 * lock( DataTable, ExperimentalDataTable );
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
		 * experimental function is available via unlock( logData ):
		 *
		 * ```js
		 * import { DataTable } from 'package1';
		 * const ExperimentalDataTable = unlock( DataTable );
		 * ```
		 */
		expect( unlock( DataTable ) ).toBe( ExperimentalDataTable );
	} );
} );
