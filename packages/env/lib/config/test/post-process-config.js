/**
 * Internal dependencies
 */
const { ValidationError } = require( '..' );
const postProcessConfig = require( '../post-process-config' );

describe( 'postProcessConfig', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'appendPortToWPConfigs', () => {
		it( 'should not change root-level options', () => {
			// Since the root-level options apply to all environments,
			// we can't add the port. This wouldn't work because each
			// environment will have its own port that is different.
			const processed = postProcessConfig( {
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
		} );

		it( 'should cascade root-level port to environments', () => {
			const processed = postProcessConfig( {
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
		} );

		it( 'should add environment-level port to environment', () => {
			const processed = postProcessConfig( {
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

		it( 'should not overwrite WP_HOME port if set', () => {
			const processed = postProcessConfig( {
				port: 123,
				testsPort: 456,
				env: {
					development: {
						config: {
							WP_TESTS_DOMAIN: 'localhost:222',
							WP_SITEURL: 'localhost:222',
							WP_HOME: 'localhost:222',
						},
					},
					tests: {
						config: {
							WP_TESTS_DOMAIN: 'localhost:333',
							WP_SITEURL: 'localhost:333',
							WP_HOME: 'localhost:333',
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
							WP_HOME: 'localhost:222',
						},
					},
					tests: {
						config: {
							WP_TESTS_DOMAIN: 'localhost:456',
							WP_SITEURL: 'localhost:456',
							WP_HOME: 'localhost:333',
						},
					},
				},
			} );
		} );
	} );

	describe( 'validatePortUniqueness', () => {
		it( 'should fail when the root port and testsPort are the same', () => {
			expect( () => {
				postProcessConfig( {
					port: 123,
					testsPort: 123,
				} );
			} ).toThrow(
				new ValidationError(
					'The "development" and "tests" environments may not have the same port.'
				)
			);
		} );

		it( 'should fail when two environments have the same port', () => {
			expect( () => {
				postProcessConfig( {
					env: {
						development: {
							port: 123,
						},
						tests: {
							port: 123,
						},
					},
				} );
			} ).toThrow(
				new ValidationError(
					'The "development" and "tests" environments may not have the same port.'
				)
			);
		} );

		it( 'should fail when root port and an environment port are the same', () => {
			expect( () => {
				postProcessConfig( {
					port: 123,
					env: {
						tests: {
							port: 123,
						},
					},
				} );
			} ).toThrow(
				new ValidationError(
					'The "development" and "tests" environments may not have the same port.'
				)
			);
		} );

		it( 'should pass when no ports are the same', () => {
			expect( () => {
				postProcessConfig( {
					port: 123,
					testsPort: 456,
				} );
			} ).not.toThrow();

			expect( () => {
				postProcessConfig( {
					env: {
						development: {
							port: 123,
						},
						tests: {
							port: 456,
						},
					},
				} );
			} ).not.toThrow();

			expect( () => {
				postProcessConfig( {
					port: 123,
					env: {
						tests: {
							port: 456,
						},
					},
				} );
			} ).not.toThrow();
		} );
	} );
} );
