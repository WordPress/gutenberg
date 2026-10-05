import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const { v2: dockerCompose } = require( 'docker-compose' );
const wordpress = require( '../runtime/docker/wordpress' );
const runtimePath = require.resolve( '../runtime/docker' );
const config = {
	workDirectoryPath: tmpdir(),
	dockerComposeConfigPath: '/unused/docker-compose.yml',
};

describe( 'Docker runtime reset', () => {
	let runtime;
	let resetDatabase;
	let configureWordPress;
	let spinner;

	beforeEach( () => {
		vi.spyOn( dockerCompose, 'upMany' ).mockResolvedValue( undefined );
		resetDatabase = vi
			.spyOn( wordpress, 'resetDatabase' )
			.mockResolvedValue( undefined );
		configureWordPress = vi
			.spyOn( wordpress, 'configureWordPress' )
			.mockResolvedValue( undefined );
		delete require.cache[ runtimePath ];
		const DockerRuntime = require( runtimePath );
		runtime = new DockerRuntime();
		spinner = { text: '' };
	} );

	afterEach( () => {
		vi.restoreAllMocks();
		delete require.cache[ runtimePath ];
	} );

	it.each( [
		[ 'development', 'development' ],
		[ 'tests', 'tests' ],
		[ 'all', 'development' ],
		[ 'all', 'tests' ],
	] )( 'rejects a failed %s reset in %s', async ( environment, failed ) => {
		const error = new Error( 'Database reset failed.' );
		resetDatabase.mockImplementation( async ( target ) => {
			if ( target === failed ) {
				throw error;
			}
		} );

		await expect(
			runtime.clean( config, { environment, spinner, debug: false } )
		).rejects.toBe( error );
		expect( configureWordPress ).not.toHaveBeenCalledWith( failed, config );
		expect( spinner.text ).toMatch( /^Resetting / );
	} );

	it.each( [
		[ 'development', 'development' ],
		[ 'tests', 'tests' ],
		[ 'all', 'development' ],
		[ 'all', 'tests' ],
	] )(
		'rejects failed WordPress configuration when resetting %s in %s',
		async ( environment, failed ) => {
			const error = new Error( 'WordPress configuration failed.' );
			configureWordPress.mockImplementation( async ( target ) => {
				if ( target === failed ) {
					throw error;
				}
			} );

			await expect(
				runtime.clean( config, { environment, spinner, debug: false } )
			).rejects.toBe( error );
			expect( resetDatabase ).toHaveBeenCalledWith( failed, config );
			expect( spinner.text ).toMatch( /^Resetting / );
		}
	);

	it.each( [
		[ 'development', [ 'development' ], [ 'mysql' ] ],
		[ 'tests', [ 'tests' ], [ 'tests-mysql' ] ],
		[ 'all', [ 'development', 'tests' ], [ 'mysql', 'tests-mysql' ] ],
	] )(
		'resets and configures the selected %s environment',
		async ( environment, targets, services ) => {
			await runtime.clean( config, {
				environment,
				spinner,
				debug: false,
			} );

			expect( dockerCompose.upMany ).toHaveBeenCalledWith( services, {
				config: config.dockerComposeConfigPath,
				log: false,
			} );
			expect( resetDatabase ).toHaveBeenCalledTimes( targets.length );
			expect( configureWordPress ).toHaveBeenCalledTimes(
				targets.length
			);
			for ( const target of targets ) {
				expect( resetDatabase ).toHaveBeenCalledWith( target, config );
				expect( configureWordPress ).toHaveBeenCalledWith(
					target,
					config
				);
			}
			expect( spinner.text ).toBe(
				`Reset ${ environment } environment${ environment === 'all' ? 's' : '' }.`
			);
		}
	);

	it( 'does not reset a disabled tests environment when resetting all', async () => {
		const developmentOnlyConfig = { ...config, testsEnvironment: false };
		await runtime.clean( developmentOnlyConfig, {
			environment: 'all',
			spinner,
			debug: false,
		} );

		expect( resetDatabase ).toHaveBeenCalledTimes( 1 );
		expect( resetDatabase ).toHaveBeenCalledWith(
			'development',
			developmentOnlyConfig
		);
		expect( configureWordPress ).toHaveBeenCalledTimes( 1 );
	} );
} );
