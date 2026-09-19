import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { buildBlueprint } = require( '../blueprint-builder' );
const { getCliArgs } = require( '../cli-args' );

const createConfig = ( development = {} ) => ( {
	env: {
		development: {
			pluginSources: [],
			themeSources: [],
			mappings: {},
			config: {},
			...development,
		},
	},
} );

describe( 'Playground runtime configuration', () => {
	it( 'selects the configured PHP version through CLI arguments', () => {
		const config = createConfig( { phpVersion: '8.3' } );
		const cliArgs = getCliArgs( config, '/tmp/playground-blueprint.json' );
		const phpArgumentIndex = cliArgs.indexOf( '--php' );

		expect( cliArgs[ phpArgumentIndex + 1 ] ).toBe( '8.3' );
		expect( buildBlueprint( config ) ).not.toHaveProperty(
			'preferredVersions'
		);
	} );
} );
