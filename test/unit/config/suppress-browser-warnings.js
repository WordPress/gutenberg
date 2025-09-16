/**
 * Suppress specific browser warnings for unit tests
 *
 * This file mocks the @wordpress/warning module to suppress specific
 * warnings that are expected or not relevant in the test environment,
 * while allowing other warnings to pass through normally.
 *
 * Note: This mock can be removed once the apiVersion:3 becomes the default.
 */

jest.mock( '@wordpress/warning', () => {
	const mockOriginalWarning =
		jest.requireActual( '@wordpress/warning' ).default;

	return {
		__esModule: true,
		default: jest.fn( ( message ) => {
			const suppressedWarningRegexes = [
				/The block ".*" is registered with API version 2 or lower/, // apiVersion warnings
			];
			if ( typeof message === 'string' ) {
				const shouldSuppress = suppressedWarningRegexes.some(
					( regex ) => regex.test( message )
				);
				if ( shouldSuppress ) {
					return;
				}
			}
			if ( typeof mockOriginalWarning === 'function' ) {
				mockOriginalWarning( message );
			}
		} ),
	};
} );
