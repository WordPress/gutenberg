/**
 * Internal dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '../';

const requiredConsent =
	'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.';

describe( '__dangerousOptInToUnstableAPIsOnlyForCoreModules', () => {
	it( 'Should require a consent string', () => {
		expect( () => {
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				'',
				'@wordpress/data'
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
				'@wordpress/edit-widgets'
			);
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@wordpress/edit-widgets'
			);
		} ).toThrow( /is already registered/ );
	} );
	it( 'Should grant access to unstable APIs when passed both a consent string and a previously unregistered package name', () => {
		const unstableAPIs = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			requiredConsent,
			'@wordpress/edit-site'
		);
		expect( unstableAPIs.unlock ).toEqual( expect.any( Function ) );
		expect( unstableAPIs.register ).toEqual( expect.any( Function ) );
	} );
	it( 'Should register and unlock experimental APIs', () => {
		// This would live in @wordpress/data:
		// Opt-in to experimental APIs
		const dataExperiments =
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@wordpress/data'
			);

		// Register the experimental APIs
		const dataExperimentalFunctions = {
			__experimentalFunction: jest.fn(),
		};
		const dataAccessKey = dataExperiments.register(
			dataExperimentalFunctions
		);

		// This would live in @wordpress/core-data:
		// Register the experimental APIs
		const coreDataExperiments =
			__dangerousOptInToUnstableAPIsOnlyForCoreModules(
				requiredConsent,
				'@wordpress/core-data'
			);

		// Get the experimental APIs registered by @wordpress/data
		const { __experimentalFunction } =
			coreDataExperiments.unlock( dataAccessKey );

		// Call one!
		__experimentalFunction();

		expect(
			dataExperimentalFunctions.__experimentalFunction
		).toHaveBeenCalled();
	} );
} );
