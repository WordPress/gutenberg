/**
 * Internal dependencies
 */
import { createSuggestionWriteQueue } from '../suggestion-write-queue';

/** Create a promise whose resolution the test controls. */
function deferred() {
	let resolve;
	let reject;
	const promise = new Promise( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

async function flushMicrotasks() {
	// A few turns so chained `.then`s inside the queue settle.
	for ( let i = 0; i < 5; i++ ) {
		await Promise.resolve();
	}
}

describe( 'createSuggestionWriteQueue', () => {
	it( 'runs tasks for the same block strictly one after another', async () => {
		const queue = createSuggestionWriteQueue();
		const first = deferred();
		const order = [];

		queue.enqueue( 'a', async () => {
			order.push( 'first:start' );
			await first.promise;
			order.push( 'first:end' );
		} );
		queue.enqueue( 'a', async () => {
			order.push( 'second:start' );
		} );
		await flushMicrotasks();

		// The second task must not start while the first is in flight.
		expect( order ).toEqual( [ 'first:start' ] );

		first.resolve();
		await flushMicrotasks();
		expect( order ).toEqual( [
			'first:start',
			'first:end',
			'second:start',
		] );
	} );

	it( 'lets tasks for different blocks run independently', async () => {
		const queue = createSuggestionWriteQueue();
		const blockedForever = deferred();
		const order = [];

		queue.enqueue( 'a', async () => {
			await blockedForever.promise;
		} );
		queue.enqueue( 'b', async () => {
			order.push( 'b:ran' );
		} );
		await flushMicrotasks();

		expect( order ).toEqual( [ 'b:ran' ] );
	} );

	it( 'does not let a rejected task poison later tasks on the block', async () => {
		const queue = createSuggestionWriteQueue();
		const order = [];

		const failing = queue.enqueue( 'a', async () => {
			throw new Error( 'boom' );
		} );
		// The caller can still observe the failure.
		await expect( failing ).rejects.toThrow( 'boom' );

		queue.enqueue( 'a', async () => {
			order.push( 'after-failure' );
		} );
		await flushMicrotasks();
		expect( order ).toEqual( [ 'after-failure' ] );
	} );

	it( 'reports and clears pending state per block', async () => {
		const queue = createSuggestionWriteQueue();
		const gate = deferred();

		expect( queue.hasPending( 'a' ) ).toBe( false );
		queue.enqueue( 'a', () => gate.promise );
		expect( queue.hasPending( 'a' ) ).toBe( true );
		expect( queue.hasPending( 'b' ) ).toBe( false );

		gate.resolve();
		await flushMicrotasks();
		expect( queue.hasPending( 'a' ) ).toBe( false );
	} );
} );
