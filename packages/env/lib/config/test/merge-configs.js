'use strict';
/**
 * Internal dependencies
 */
const mergeConfigs = require( '../merge-configs' );

describe( 'mergeConfigs', () => {
	it( 'should merge configs without environments', () => {
		const merged = mergeConfigs(
			{
				port: 8888,
				coreSource: {
					type: 'local',
					path: '/home/test',
				},
				config: {
					WP_TEST: 'test',
				},
				lifecycleScripts: {
					afterStart: 'test',
				},
			},
			{
				port: 8889,
				config: {
					WP_TEST_2: 'test-2',
				},
				lifecycleScripts: {
					afterDestroy: 'test-2',
				},
			}
		);

		expect( merged ).toEqual( {
			port: 8889,
			coreSource: {
				type: 'local',
				path: '/home/test',
			},
			config: {
				WP_TEST: 'test',
				WP_TEST_2: 'test-2',
			},
			lifecycleScripts: {
				afterStart: 'test',
				afterDestroy: 'test-2',
			},
		} );
	} );

	it( 'should merge configs with environments', () => {
		const merged = mergeConfigs(
			{
				port: 8888,
				coreSource: {
					type: 'local',
					path: '/home/test',
				},
				config: {
					WP_TEST: 'test',
				},
				env: {
					development: {
						config: {
							WP_TEST_3: 'test-3',
						},
					},
					tests: {
						config: {
							WP_TEST_4: 'test-4',
						},
					},
				},
			},
			{
				port: 8889,
				config: {
					WP_TEST_2: 'test-2',
				},
				env: {
					development: {
						config: {
							WP_TEST_5: 'test-5',
						},
					},
					tests: {
						config: {
							WP_TEST_6: 'test-6',
						},
					},
				},
			}
		);

		expect( merged ).toEqual( {
			port: 8889,
			coreSource: {
				type: 'local',
				path: '/home/test',
			},
			config: {
				WP_TEST: 'test',
				WP_TEST_2: 'test-2',
			},
			env: {
				development: {
					config: {
						WP_TEST_3: 'test-3',
						WP_TEST_5: 'test-5',
					},
				},
				tests: {
					config: {
						WP_TEST_4: 'test-4',
						WP_TEST_6: 'test-6',
					},
				},
			},
		} );
	} );
} );
