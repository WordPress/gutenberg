'use strict';

const Ajv = require( 'ajv' );
const schema = require( '../wp-env.schema.json' );

describe( 'wp-env schema', () => {
	const ajv = new Ajv( { allErrors: true } );
	const validate = ajv.compile( schema );

	it( 'accepts a valid root and env configuration', () => {
		const config = {
			$schema: 'https://schemas.wordpress.org/wp-env.schema.json',
			core: 'WordPress/WordPress#6.8',
			phpVersion: '8.2',
			plugins: [ '.' ],
			port: 8888,
			autoPort: true,
			phpmyadmin: true,
			phpmyadminPort: 3307,
			config: {
				WP_HOME: 'http://localhost:8888',
				WP_SITEURL: 'http://localhost:8888',
				WP_DEBUG: true,
			},
			env: {
				tests: {
					port: 8889,
					config: {
						WP_DEBUG: false,
					},
				},
			},
		};

		expect( validate( config ) ).toBe( true );
	} );

	it( 'rejects unknown root and environment keys', () => {
		const config = {
			port: 8888,
			unknownRootOption: true,
			env: {
				development: {
					testsPort: 9999,
					autoPort: true,
				},
			},
		};

		expect( validate( config ) ).toBe( false );
		expect( validate.errors ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					keyword: 'additionalProperties',
					params: expect.objectContaining( {
						additionalProperty: 'unknownRootOption',
					} ),
				} ),
				expect.objectContaining( {
					keyword: 'additionalProperties',
					params: expect.objectContaining( {
						additionalProperty: 'testsPort',
					} ),
				} ),
				expect.objectContaining( {
					keyword: 'additionalProperties',
					params: expect.objectContaining( {
						additionalProperty: 'autoPort',
					} ),
				} ),
			] )
		);
	} );
} );
