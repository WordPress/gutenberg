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

describe( 'DockerRuntime.clean', () => {
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
		// The runtime binds the helpers when it is loaded, so load it after
		// the spies are in place.
		delete require.cache[ runtimePath ];
		const DockerRuntime = require( runtimePath );
		runtime = new DockerRuntime();
		spinner = { text: '' };
	} );

	afterEach( () => {
		vi.restoreAllMocks();
		delete require.cache[ runtimePath ];
	} );

	it.each( [ 'development', 'tests', 'all' ] )(
		'resets and configures the %s environment',
		async ( environment ) => {
			await runtime.clean( config, {
				environment,
				spinner,
				debug: false,
			} );

			const targets =
				environment === 'all'
					? [ 'development', 'tests' ]
					: [ environment ];
			for ( const target of targets ) {
				expect( resetDatabase ).toHaveBeenCalledWith( target, config );
				expect( configureWordPress ).toHaveBeenCalledWith(
					target,
					config
				);
			}
			expect( resetDatabase ).toHaveBeenCalledTimes( targets.length );
			expect( spinner.text ).toBe(
				`Reset ${ environment } environment${
					environment === 'all' ? 's' : ''
				}.`
			);
		}
	);

	it( 'rejects when the database reset fails', async () => {
		const error = new Error( 'wp db reset failed' );
		resetDatabase.mockRejectedValue( error );

		await expect(
			runtime.clean( config, {
				environment: 'development',
				spinner,
				debug: false,
			} )
		).rejects.toBe( error );
		expect( configureWordPress ).not.toHaveBeenCalled();
	} );

	it( 'rejects when configuring WordPress fails', async () => {
		const error = new Error( 'wp core install failed' );
		configureWordPress.mockRejectedValue( error );

		await expect(
			runtime.clean( config, {
				environment: 'tests',
				spinner,
				debug: false,
			} )
		).rejects.toBe( error );
	} );

	it( 'finishes the other environment before rejecting when one of them fails', async () => {
		const error = new Error( 'wp db reset failed' );
		let finishTests;
		resetDatabase.mockImplementation( ( environment ) => {
			if ( environment === 'development' ) {
				return Promise.reject( error );
			}
			return new Promise( ( resolve ) => {
				finishTests = resolve;
			} );
		} );

		const cleaning = runtime.clean( config, {
			environment: 'all',
			spinner,
			debug: false,
		} );
		let settled = false;
		cleaning.catch( () => {
			settled = true;
		} );
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		expect( settled ).toBe( false );

		finishTests();
		await expect( cleaning ).rejects.toBe( error );
		expect( configureWordPress ).toHaveBeenCalledTimes( 1 );
		expect( configureWordPress ).toHaveBeenCalledWith( 'tests', config );
	} );

	it( 'does not reset a disabled tests environment', async () => {
		const developmentOnly = { ...config, testsEnvironment: false };

		await runtime.clean( developmentOnly, {
			environment: 'all',
			spinner,
			debug: false,
		} );

		expect( resetDatabase ).toHaveBeenCalledTimes( 1 );
		expect( resetDatabase ).toHaveBeenCalledWith(
			'development',
			developmentOnly
		);
	} );
} );
