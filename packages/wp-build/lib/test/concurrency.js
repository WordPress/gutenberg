/**
 * Internal dependencies
 */
import { createLimiter, resolveConcurrency } from '../concurrency.mjs';

describe( 'createLimiter()', () => {
	it( 'never runs more tasks than the limit at once', async () => {
		const runLimited = createLimiter( 2 );
		let active = 0;
		let maxActive = 0;

		await Promise.all(
			Array.from( { length: 8 }, () =>
				runLimited( async () => {
					active++;
					maxActive = Math.max( maxActive, active );
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 5 )
					);
					active--;
				} )
			)
		);

		expect( maxActive ).toBe( 2 );
	} );

	it( 'resolves with each task return value', async () => {
		const runLimited = createLimiter( 1 );

		const results = await Promise.all(
			[ 1, 2, 3 ].map( ( value ) => runLimited( async () => value * 10 ) )
		);

		expect( results ).toEqual( [ 10, 20, 30 ] );
	} );

	it( 'keeps scheduling after a task rejects', async () => {
		const runLimited = createLimiter( 1 );

		const failing = runLimited( async () => {
			throw new Error( 'boom' );
		} );
		const following = runLimited( async () => 'ok' );

		await expect( failing ).rejects.toThrow( 'boom' );
		await expect( following ).resolves.toBe( 'ok' );
	} );

	it( 'propagates synchronous task throws as rejections', async () => {
		const runLimited = createLimiter( 1 );

		await expect(
			runLimited( () => {
				throw new Error( 'sync boom' );
			} )
		).rejects.toThrow( 'sync boom' );
	} );
} );

describe( 'resolveConcurrency()', () => {
	it( 'prefers the CLI flag over the environment variable', () => {
		expect( resolveConcurrency( '3', { WP_BUILD_CONCURRENCY: '7' } ) ).toBe(
			3
		);
	} );

	it( 'falls back to WP_BUILD_CONCURRENCY when no flag is given', () => {
		expect(
			resolveConcurrency( undefined, { WP_BUILD_CONCURRENCY: '7' } )
		).toBe( 7 );
	} );

	it( 'defaults to the available parallelism when nothing is set', () => {
		const resolved = resolveConcurrency( undefined, {} );

		expect( Number.isInteger( resolved ) ).toBe( true );
		expect( resolved ).toBeGreaterThanOrEqual( 1 );
	} );

	it( 'treats an empty environment value as unset', () => {
		const resolved = resolveConcurrency( undefined, {
			WP_BUILD_CONCURRENCY: '',
		} );

		expect( resolved ).toBeGreaterThanOrEqual( 1 );
	} );

	it( 'rejects values that are not positive integers', () => {
		for ( const value of [ '0', '-2', '1.5', 'abc' ] ) {
			expect( () => resolveConcurrency( value, {} ) ).toThrow(
				'Invalid concurrency value'
			);
		}
	} );
} );
