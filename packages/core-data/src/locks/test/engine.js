/**
 * Internal dependencies
 */
import createLocks from '../engine';

jest.useRealTimers();

// We correctly await all promises with expect calls, but the rule doesn't detect that.
/* eslint-disable jest/valid-expect-in-promise */

describe( 'Locks engine', () => {
	it( 'does not grant two exclusive locks at once', async () => {
		const locks = createLocks();

		let l1Granted = false;
		let l2Granted = false;

		// Request two locks.
		const l1 = locks.acquire( 'store', [ 'root' ], true );
		const l2 = locks.acquire( 'store', [ 'root' ], true );

		// On each grant, verify that the other lock is not granted at the same time.
		const check1 = l1.then( () => {
			l1Granted = true;
			expect( l2Granted ).toBe( false );
		} );

		const check2 = l2.then( () => {
			l2Granted = true;
			expect( l1Granted ).toBe( false );
		} );

		// Unlock both.
		const lock1 = await l1;
		locks.release( lock1 );
		l1Granted = false;

		const lock2 = await l2;
		locks.release( lock2 );
		l2Granted = false;

		// Ensure that both locks were granted and checked.
		return await Promise.all( [ check1, check2 ] );
	} );

	it( 'does not grant an exclusive lock if a non-exclusive one already exists', async () => {
		const locks = createLocks();

		let l1Granted = false;
		let l2Granted = false;

		// Request two locks.
		const l1 = locks.acquire( 'store', [ 'root' ], false );
		const l2 = locks.acquire( 'store', [ 'root' ], true );

		// On each grant, verify that the other lock is not granted at the same time.
		const check1 = l1.then( () => {
			l1Granted = true;
			expect( l2Granted ).toBe( false );
		} );

		const check2 = l2.then( () => {
			l2Granted = true;
			expect( l1Granted ).toBe( false );
		} );

		// Unlock both.
		const lock1 = await l1;
		locks.release( lock1 );
		l1Granted = false;

		const lock2 = await l2;
		locks.release( lock2 );
		l2Granted = false;

		// Ensure that both locks were granted and checked.
		return await Promise.all( [ check1, check2 ] );
	} );

	it( 'does not grant two exclusive locks to parent and child', async () => {
		const locks = createLocks();

		let l1Granted = false;
		let l2Granted = false;

		// Request two locks.
		const l1 = locks.acquire( 'store', [ 'root' ], true );
		const l2 = locks.acquire( 'store', [ 'root', 'child' ], true );

		// On each grant, verify that the other lock is not granted at the same time.
		const check1 = l1.then( () => {
			l1Granted = true;
			expect( l2Granted ).toBe( false );
		} );

		const check2 = l2.then( () => {
			l2Granted = true;
			expect( l1Granted ).toBe( false );
		} );

		// Unlock both.
		const lock1 = await l1;
		locks.release( lock1 );
		l1Granted = false;

		const lock2 = await l2;
		locks.release( lock2 );
		l2Granted = false;

		// Ensure that both locks were granted and checked.
		return await Promise.all( [ check1, check2 ] );
	} );

	it( 'grants two non-exclusive locks at once', async () => {
		const locks = createLocks();

		const l1 = await locks.acquire( 'store', [ 'root' ], false );
		const l2 = await locks.acquire( 'store', [ 'root' ], false );

		expect( l1 ).not.toBeUndefined();
		expect( l2 ).not.toBeUndefined();
	} );

	it( 'grants two exclusive locks to different branches', async () => {
		const locks = createLocks();

		const l1 = await locks.acquire( 'store', [ 'a' ], true );
		const l2 = await locks.acquire( 'store', [ 'b' ], true );

		expect( l1 ).not.toBeUndefined();
		expect( l2 ).not.toBeUndefined();
	} );
} );

/* eslint-enable jest/valid-expect-in-promise */
