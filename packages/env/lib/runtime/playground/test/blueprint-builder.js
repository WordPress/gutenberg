import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const {
	buildBlueprint,
	getDatabaseConfigArgs,
} = require( '../blueprint-builder' );

describe( 'Playground database configuration', () => {
	it.each( [
		undefined,
		{},
		{
			DB_PATH: null,
			DB_DIR: null,
			DB_FILE: null,
			FQDBDIR: null,
			FQDB: null,
		},
	] )(
		'leaves default storage to Playground with config %j',
		( constants ) => {
			const config = { env: { development: { config: constants } } };

			expect( getDatabaseConfigArgs( config ) ).toEqual( [] );
			expect( buildBlueprint( config ).steps ).not.toContainEqual(
				expect.objectContaining( { step: 'defineWpConfigConsts' } )
			);
		}
	);

	it.each( [
		[
			{ DB_PATH: '/wordpress/custom.sqlite' },
			[ '--define', 'DB_PATH', '/wordpress/custom.sqlite' ],
		],
		[
			{ DB_PATH: "/wordpress/data with spaces/a=b'ž.sqlite" },
			[
				'--define',
				'DB_PATH',
				"/wordpress/data with spaces/a=b'ž.sqlite",
			],
		],
		[
			{ DB_DIR: '/wordpress/custom', DB_FILE: 'legacy.sqlite' },
			[
				'--define',
				'DB_DIR',
				'/wordpress/custom',
				'--define',
				'DB_FILE',
				'legacy.sqlite',
			],
		],
		[
			{ DB_DIR: '/wordpress/custom' },
			[ '--define', 'DB_DIR', '/wordpress/custom' ],
		],
		[
			{ DB_FILE: 'legacy.sqlite' },
			[ '--define', 'DB_FILE', 'legacy.sqlite' ],
		],
		[
			{ FQDBDIR: '/wordpress/custom/' },
			[ '--define', 'FQDBDIR', '/wordpress/custom/' ],
		],
		[
			{ FQDB: '/wordpress/custom.sqlite' },
			[ '--define', 'FQDB', '/wordpress/custom.sqlite' ],
		],
	] )(
		'generates startup arguments and omits database settings from the Blueprint: %j',
		( constants, args ) => {
			const config = { env: { development: { config: constants } } };

			expect( getDatabaseConfigArgs( config ) ).toEqual( args );
			expect( buildBlueprint( config ).steps ).not.toContainEqual(
				expect.objectContaining( { step: 'defineWpConfigConsts' } )
			);
		}
	);

	it( 'preserves other constants and Blueprint step order', () => {
		const config = {
			env: {
				development: {
					pluginSources: [ { type: 'local', basename: 'example' } ],
					multisite: true,
					config: {
						DB_PATH: '/wordpress/custom.sqlite',
						WP_DEBUG: false,
						WP_POST_REVISIONS: 0,
						WP_HOME: 'http://localhost:8888',
						WP_ENVIRONMENT_TYPE: '',
						SCRIPT_DEBUG: null,
					},
				},
			},
		};

		expect( getDatabaseConfigArgs( config ) ).toEqual( [
			'--define',
			'DB_PATH',
			'/wordpress/custom.sqlite',
		] );
		expect( buildBlueprint( config ).steps ).toEqual( [
			{ step: 'login', username: 'admin', password: 'password' },
			{
				step: 'activatePlugin',
				pluginPath: '/wordpress/wp-content/plugins/example',
			},
			{
				step: 'defineWpConfigConsts',
				consts: {
					WP_DEBUG: false,
					WP_POST_REVISIONS: 0,
					WP_HOME: 'http://localhost:8888',
					WP_ENVIRONMENT_TYPE: '',
				},
			},
			{ step: 'enableMultisite' },
		] );
	} );
} );
