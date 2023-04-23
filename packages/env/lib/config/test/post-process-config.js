/**
 * Internal dependencies
 */
const postProcessConfig = require( '../post-process-config' );

describe( 'postProcessConfig', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should add port to special wp-config options', () => {
		// Root-level options should never be changed. This wouldn't work
		// since these are environment-specific in nature.
		let processed = postProcessConfig( {
			port: 123,
			config: {
				WP_TESTS_DOMAIN: 'localhost',
				WP_SITEURL: 'localhost',
				WP_HOME: 'localhost',
			},
		} );
		expect( processed ).toEqual( {
			port: 123,
			config: {
				WP_TESTS_DOMAIN: 'localhost',
				WP_SITEURL: 'localhost',
				WP_HOME: 'localhost',
			},
		} );

		// Root-level port added to environment-level config.
		processed = postProcessConfig( {
			port: 123,
			testsPort: 456,
			env: {
				development: {
					config: {
						WP_TESTS_DOMAIN: 'localhost',
						WP_SITEURL: 'localhost',
						WP_HOME: 'localhost',
					},
				},
				tests: {
					config: {
						WP_TESTS_DOMAIN: 'localhost',
						WP_SITEURL: 'localhost',
						WP_HOME: 'localhost',
					},
				},
			},
		} );
		expect( processed ).toEqual( {
			port: 123,
			testsPort: 456,
			env: {
				development: {
					config: {
						WP_TESTS_DOMAIN: 'localhost:123',
						WP_SITEURL: 'localhost:123',
						WP_HOME: 'localhost:123',
					},
				},
				tests: {
					config: {
						WP_TESTS_DOMAIN: 'localhost:456',
						WP_SITEURL: 'localhost:456',
						WP_HOME: 'localhost:456',
					},
				},
			},
		} );

		// Environment-level port added to environment-level config.
		processed = postProcessConfig( {
			port: 123,
			env: {
				development: {
					port: 456,
					config: {
						WP_TESTS_DOMAIN: 'localhost',
						WP_SITEURL: 'localhost',
						WP_HOME: 'localhost',
					},
				},
			},
		} );
		expect( processed ).toEqual( {
			port: 123,
			env: {
				development: {
					port: 456,
					config: {
						WP_TESTS_DOMAIN: 'localhost:456',
						WP_SITEURL: 'localhost:456',
						WP_HOME: 'localhost:456',
					},
				},
			},
		} );
	} );
} );
