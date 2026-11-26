import { describe, expect, it } from 'vitest';
import { createUploadQueue } from '../upload-queue';

/**
 * Waits for the queue to start the tasks waiting for a slot, which it does in
 * a microtask after a slot is released.
 */
function waitForQueue() {
	return Promise.resolve();
}

describe( 'createUploadQueue', () => {
	it( 'starts at most `limit` tasks at once, in the order they were added', () => {
		const enqueue = createUploadQueue( 2 );
		const started: string[] = [];

		enqueue( () => started.push( 'a' ) );
		enqueue( () => started.push( 'b' ) );
		enqueue( () => started.push( 'c' ) );

		expect( started ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'starts the next waiting task once a slot is released, after the releasing code has returned', async () => {
		const enqueue = createUploadQueue( 1 );
		const events: string[] = [];
		let releaseFirst = () => {};

		enqueue( ( release ) => {
			releaseFirst = release;
		} );
		enqueue( () => events.push( 'b started' ) );

		releaseFirst();
		events.push( 'release returned' );
		await waitForQueue();

		expect( events ).toEqual( [ 'release returned', 'b started' ] );
	} );

	it( 'ignores a second release of the same task', async () => {
		const enqueue = createUploadQueue( 1 );
		const started: string[] = [];
		let releaseFirst = () => {};

		enqueue( ( release ) => {
			releaseFirst = release;
		} );
		enqueue( () => started.push( 'b' ) );
		enqueue( () => started.push( 'c' ) );

		releaseFirst();
		releaseFirst();
		await waitForQueue();

		expect( started ).toEqual( [ 'b' ] );
	} );

	it( 'keeps going through tasks that release their slot while starting, in order', async () => {
		const enqueue = createUploadQueue( 1 );
		const started: number[] = [];
		let releaseFirst = () => {};

		enqueue( ( release ) => {
			releaseFirst = release;
		} );
		for ( let index = 0; index < 10000; index++ ) {
			enqueue( ( release ) => {
				started.push( index );
				release();
			} );
		}

		releaseFirst();

		await waitForQueue();

		expect( started ).toHaveLength( 10000 );
		expect( started.every( ( value, index ) => value === index ) ).toBe(
			true
		);
	} );

	it( 'starts the tasks behind a task that throws, and rethrows its error', () => {
		const enqueue = createUploadQueue( 1 );
		const started: string[] = [];
		let releaseFirst = () => {};

		enqueue( ( release ) => {
			releaseFirst = release;
		} );
		enqueue( ( release ) => {
			release();
			throw new Error( 'Task failed' );
		} );
		enqueue( () => started.push( 'c' ) );

		// The waiting tasks start from a microtask, so drain them by adding
		// a task while the slot is free instead.
		releaseFirst();
		expect( () => enqueue( () => started.push( 'd' ) ) ).toThrow(
			'Task failed'
		);
		expect( started ).toEqual( [ 'c' ] );
	} );
} );
