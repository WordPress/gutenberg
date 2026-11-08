import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	enqueueBuild,
	getDefaultBuildConcurrency,
	setBuildConcurrency,
} from '../build-concurrency.mjs';

vi.mock( import( 'rolldown' ), () => ( {
	build: vi.fn(),
} ) );

const flushPromises = () =>
	new Promise( ( resolve ) => {
		setTimeout( resolve, 0 );
	} );

describe( 'getDefaultBuildConcurrency()', () => {
	it( 'uses half of the available parallelism, rounded up', () => {
		expect( getDefaultBuildConcurrency( 1 ) ).toBe( 1 );
		expect( getDefaultBuildConcurrency( 2 ) ).toBe( 1 );
		expect( getDefaultBuildConcurrency( 3 ) ).toBe( 2 );
		expect( getDefaultBuildConcurrency( 4 ) ).toBe( 2 );
		expect( getDefaultBuildConcurrency( 5 ) ).toBe( 3 );
		expect( getDefaultBuildConcurrency( 12 ) ).toBe( 6 );
		expect( getDefaultBuildConcurrency( 64 ) ).toBe( 32 );
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
