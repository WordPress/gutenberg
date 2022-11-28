/**
 * Internal dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '../';
import {
	resetRegisteredExperiments,
	resetAllowedCoreModules,
	allowCoreModule,
	experimentId,
	makeExperimentId,
	configureExperiment,
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

describe( 'advanced lock() and unlock()', () => {
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

	it( 'Should assign the private data not to the object, but to the object under `experimentId`', () => {
		const thisExperimentId = makeExperimentId();
		const object1 = {
			[ experimentId ]: thisExperimentId,
		};
		const object2 = {
			[ experimentId ]: thisExperimentId,
		};
		lock( object1, 'sh' );
		expect( unlock( object1 ) ).toBe( 'sh' );
		expect( unlock( object2 ) ).toBe( 'sh' );
	} );

	it( 'configureExperiment() should preserve the `experimentId`', () => {
		const thisExperimentId = makeExperimentId();
		const object1 = {
			[ experimentId ]: thisExperimentId,
		};
		const object2 = {
			[ experimentId ]: thisExperimentId,
		};
		configureExperiment( object2, {} );
		lock( object1, 'sh' );
		expect( unlock( object1 ) ).toBe( 'sh' );
		expect( unlock( object2 ) ).toBe( 'sh' );
	} );

	it( 'Should call the lazy decorator specified bia configureExperiment() on the first unlock()', () => {
		const thisExperimentId = makeExperimentId();
		const object1 = {
			[ experimentId ]: thisExperimentId,
		};
		const object2 = {
			[ experimentId ]: thisExperimentId,
		};
		configureExperiment( object2, {
			lazyDecorator( secretString ) {
				return `Decorated: ${ secretString }`;
			},
		} );
		lock( object1, 'sh' );
		expect( unlock( object1 ) ).toBe( 'sh' );
		expect( unlock( object2 ) ).toBe( 'Decorated: sh' );
		expect( unlock( object1 ) ).toBe( 'Decorated: sh' );
	} );
} );
