/**
 * @jest-environment node
 */

/**
 * Internal dependencies
 */
import {
	enqueueBuild,
	getDefaultBuildConcurrency,
	parseBuildConcurrency,
	setBuildConcurrency,
} from '../build-concurrency.mjs';

const flushPromises = () =>
	new Promise( ( resolve ) => {
		setTimeout( resolve, 0 );
	} );

describe( 'getDefaultBuildConcurrency()', () => {
	it( 'uses half the available parallelism clamped to the default range', () => {
		expect( getDefaultBuildConcurrency( 1 ) ).toBe( 2 );
		expect( getDefaultBuildConcurrency( 2 ) ).toBe( 2 );
		expect( getDefaultBuildConcurrency( 4 ) ).toBe( 2 );
		expect( getDefaultBuildConcurrency( 12 ) ).toBe( 6 );
		expect( getDefaultBuildConcurrency( 16 ) ).toBe( 8 );
		expect( getDefaultBuildConcurrency( 32 ) ).toBe( 8 );
	} );
} );

describe( 'parseBuildConcurrency()', () => {
	it( 'returns undefined when no value is configured', () => {
		expect( parseBuildConcurrency( undefined, '--concurrency' ) ).toBe(
			undefined
		);
	} );

	it( 'accepts positive integers', () => {
		expect( parseBuildConcurrency( '1', '--concurrency' ) ).toBe( 1 );
		expect( parseBuildConcurrency( '01', '--concurrency' ) ).toBe( 1 );
		expect( parseBuildConcurrency( '12', '--concurrency' ) ).toBe( 12 );
	} );

	it( 'rejects invalid values', () => {
		for ( const value of [ '', '0', '-1', '1.5', 'abc' ] ) {
			expect( () =>
				parseBuildConcurrency( value, '--concurrency' )
			).toThrow(
				'Invalid --concurrency value: ' +
					JSON.stringify( value ) +
					'. Expected a positive integer.'
			);
		}
	} );
} );

describe( 'enqueueBuild()', () => {
	afterEach( () => {
		setBuildConcurrency( getDefaultBuildConcurrency( 12 ) );
	} );

	it( 'runs no more than the configured number of tasks at once', async () => {
		setBuildConcurrency( 2 );

		const startedTasks = [];
		const taskResolvers = [];
		const tasks = [ 0, 1, 2, 3 ].map( ( index ) =>
			enqueueBuild(
				() =>
					new Promise( ( resolve ) => {
						startedTasks.push( index );
						taskResolvers[ index ] = resolve;
					} )
			)
		);

		await flushPromises();

		expect( startedTasks ).toEqual( [ 0, 1 ] );

		taskResolvers[ 0 ]( 'first' );
		await flushPromises();

		expect( startedTasks ).toEqual( [ 0, 1, 2 ] );

		taskResolvers[ 1 ]( 'second' );
		await flushPromises();

		expect( startedTasks ).toEqual( [ 0, 1, 2, 3 ] );

		taskResolvers[ 2 ]( 'third' );
		taskResolvers[ 3 ]( 'fourth' );

		await expect( Promise.all( tasks ) ).resolves.toEqual( [
			'first',
			'second',
			'third',
			'fourth',
		] );
	} );
} );
