import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createDeferredUpdateQueue,
	type DeferredUpdate,
} from '../deferred-updates';

describe( 'createDeferredUpdateQueue', () => {
	beforeEach( () => {
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	// An update for the post with the given ID. The title names the update,
	// so that a test can check which updates were applied and in what order.
	function createUpdate( objectId: string, title: string ): DeferredUpdate {
		return {
			changes: { title },
			objectId,
			objectType: 'post',
			options: {},
			origin: 'local',
		};
	}

	function createQueue() {
		const applied: unknown[] = [];
		const queue = createDeferredUpdateQueue( ( update ) =>
			applied.push( update.changes.title )
		);

		return { applied, queue };
	}

	it( 'applies the updates on the next tick, in the order they were added', () => {
		const { applied, queue } = createQueue();

		queue.defer( 'a', createUpdate( 'a', 'a1' ) );
		queue.defer( 'b', createUpdate( 'b', 'b1' ) );
		queue.defer( 'a', createUpdate( 'a', 'a2' ) );
		expect( applied ).toEqual( [] );

		vi.runAllTimers();
		expect( applied ).toEqual( [ 'a1', 'b1', 'a2' ] );
	} );

	it( 'applies the updates one time when flushed before the tick', () => {
		const { applied, queue } = createQueue();

		queue.defer( 'a', createUpdate( 'a', 'a1' ) );
		queue.flush();
		expect( applied ).toEqual( [ 'a1' ] );

		vi.runAllTimers();
		expect( applied ).toEqual( [ 'a1' ] );
	} );

	it( 'keeps the order when applying an update asks for a flush', () => {
		const applied: unknown[] = [];
		const queue = createDeferredUpdateQueue( ( update ) => {
			queue.flush();
			applied.push( update.changes.title );
		} );

		queue.defer( 'a', createUpdate( 'a', 'a1' ) );
		queue.defer( 'a', createUpdate( 'a', 'a2' ) );
		queue.flush();

		expect( applied ).toEqual( [ 'a1', 'a2' ] );
	} );

	it( 'updates the items of one key without changing their queue positions', () => {
		const { applied, queue } = createQueue();
		const a1 = createUpdate( 'a', 'a1' );
		const a2 = createUpdate( 'a', 'a2' );

		queue.defer( 'a', a1 );
		queue.defer( 'b', createUpdate( 'b', 'b1' ) );
		queue.defer( 'a', a2 );

		expect( queue.get( 'a' ) ).toEqual( [ a1, a2 ] );
		for ( const item of queue.get( 'a' ) ) {
			item.changes.title += ' updated';
		}

		vi.runAllTimers();
		expect( applied ).toEqual( [ 'a1 updated', 'b1', 'a2 updated' ] );
		expect( queue.get( 'a' ) ).toEqual( [] );
	} );
} );
