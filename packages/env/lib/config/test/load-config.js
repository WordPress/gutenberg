'use strict';
/**
 * External dependencies
 */
const { stat } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const loadConfig = require( '../load-config' );
const getCacheDirectory = require( '../get-cache-directory' );
const md5 = require( '../../md5' );
const { parseConfig } = require( '../parse-config' );
const postProcessConfig = require( '../post-process-config' );

jest.mock( 'fs', () => ( {
	promises: {
		stat: jest.fn(),
	},
} ) );
jest.mock( '../get-cache-directory', () => jest.fn() );
jest.mock( '../../md5', () => jest.fn() );
jest.mock( '../parse-config', () => ( {
	parseConfig: jest.fn(),
	getConfigFilePath: jest.fn(),
} ) );
jest.mock( '../post-process-config', () => jest.fn() );

describe( 'loadConfig', () => {
	beforeEach( () => {
		getCacheDirectory.mockResolvedValue( '/home/cache' );
		md5.mockReturnValue( 'as9d8g7daf86asd98a7sd678asd' );

		const mockConfig = {
			coreSource: {
				name: 'test-root',
			},
			config: {
				TEST_CONFIG_1: 'Test Config 1',
			},
			pluginSources: [],
			themeSources: [],
			mappings: {},
			env: {
				development: {
					coreSource: {
						name: 'test-development',
					},
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
				tests: {
					config: {
						TEST_CONFIG_2: 'Test Config 2',
					},
					coreSource: {
						name: 'test-tests',
					},
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
			},
		};
		parseConfig.mockResolvedValue( mockConfig );
		postProcessConfig.mockReturnValue( mockConfig );
		stat.mockResolvedValue( true );
	} );

	it( 'should flatten root config into environment configs', async () => {
		const parsed = await loadConfig( '/test' );

		expect( parsed ).toEqual( {
			name: 'test',
			dockerComposeConfigPath:
				'/home/cache/as9d8g7daf86asd98a7sd678asd/docker-compose.yml',
			configDirectoryPath: '/test',
			workDirectoryPath: '/home/cache/as9d8g7daf86asd98a7sd678asd',
			detectedLocalConfig: true,
			env: {
				development: {
					coreSource: {
						name: 'test-development',
					},
					config: {
						TEST_CONFIG_1: 'Test Config 1',
					},
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
				tests: {
					coreSource: {
						name: 'test-tests',
					},
					config: {
						TEST_CONFIG_1: 'Test Config 1',
						TEST_CONFIG_2: 'Test Config 2',
					},
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
			},
		} );
	} );
} );
