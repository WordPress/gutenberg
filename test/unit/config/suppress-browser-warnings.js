/**
 * Suppress specific browser warnings for unit tests
 *
 * This file mocks the @wordpress/deprecated module to suppress specific
 * deprecation warnings that are expected or not relevant in the test environment,
 * while allowing other deprecation warnings to pass through normally.
 *
 * Note: This mock can be removed once the apiVersion:3 becomes the default.
 */

jest.mock( '@wordpress/deprecated', () => {
	const mockOriginalDeprecated = jest.requireActual(
		'@wordpress/deprecated'
	).default;

	return {
		__esModule: true,
		default: jest.fn( ( feature, options = {} ) => {
			const suppressedFeatures = [
				'Block with API version 2 or lower', // apiVersion deprecation warnings
			];
			if ( typeof feature === 'string' ) {
				const shouldSuppress = suppressedFeatures.includes( feature );
				if ( shouldSuppress && options.since === '6.9' ) {
					return;
				}
			}
			if ( typeof mockOriginalDeprecated === 'function' ) {
				mockOriginalDeprecated( feature, options );
			}
		} ),
	};
} );
