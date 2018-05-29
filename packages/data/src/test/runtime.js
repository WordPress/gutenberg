/**
 * Internal dependencies
 */
import {
	isActionLike,
	isAsyncIterable,
	isIterable,
	toAsyncIterable,
} from '../runtime';

describe( 'isActionLike', () => {
	it( 'returns false if non-action-like', () => {
		expect( isActionLike( undefined ) ).toBe( false );
		expect( isActionLike( null ) ).toBe( false );
		expect( isActionLike( [] ) ).toBe( false );
		expect( isActionLike( {} ) ).toBe( false );
		expect( isActionLike( 1 ) ).toBe( false );
		expect( isActionLike( 0 ) ).toBe( false );
		expect( isActionLike( Infinity ) ).toBe( false );
		expect( isActionLike( { type: null } ) ).toBe( false );
	} );

	it( 'returns true if action-like', () => {
		expect( isActionLike( { type: 'POW' } ) ).toBe( true );
	} );
} );

describe( 'isAsyncIterable', () => {
	it( 'returns false if not async iterable', () => {
		expect( isAsyncIterable( undefined ) ).toBe( false );
		expect( isAsyncIterable( null ) ).toBe( false );
		expect( isAsyncIterable( [] ) ).toBe( false );
		expect( isAsyncIterable( {} ) ).toBe( false );
	} );

	it( 'returns true if async iterable', async () => {
		async function* getAsyncIterable() {
			yield new Promise( ( resolve ) => process.nextTick( resolve ) );
		}

		const result = getAsyncIterable();

		expect( isAsyncIterable( result ) ).toBe( true );

		await result;
	} );
} );

describe( 'isIterable', () => {
	it( 'returns false if not iterable', () => {
		expect( isIterable( undefined ) ).toBe( false );
		expect( isIterable( null ) ).toBe( false );
		expect( isIterable( {} ) ).toBe( false );
		expect( isIterable( Promise.resolve( {} ) ) ).toBe( false );
	} );

	it( 'returns true if iterable', () => {
		function* getIterable() {
			yield 'foo';
		}

		const result = getIterable();

		expect( isIterable( result ) ).toBe( true );
		expect( isIterable( [] ) ).toBe( true );
	} );
} );

describe( 'toAsyncIterable', () => {
	it( 'normalizes async iterable', async () => {
		async function* getAsyncIterable() {
			yield await Promise.resolve( { ok: true } );
		}

		const object = getAsyncIterable();
		const normalized = toAsyncIterable( object );

		expect( ( await normalized.next() ).value ).toEqual( { ok: true } );
	} );

	it( 'normalizes promise', async () => {
		const object = Promise.resolve( { ok: true } );
		const normalized = toAsyncIterable( object );

		expect( ( await normalized.next() ).value ).toEqual( { ok: true } );
	} );

	it( 'normalizes object', async () => {
		const object = { ok: true };
		const normalized = toAsyncIterable( object );

		expect( ( await normalized.next() ).value ).toEqual( { ok: true } );
	} );

	it( 'normalizes array of promise', async () => {
		const object = [ Promise.resolve( { ok: true } ) ];
		const normalized = toAsyncIterable( object );

		expect( ( await normalized.next() ).value ).toEqual( { ok: true } );
	} );

	it( 'normalizes mixed array', async () => {
		const object = [ { foo: 'bar' }, Promise.resolve( { ok: true } ) ];
		const normalized = toAsyncIterable( object );

		expect( ( await normalized.next() ).value ).toEqual( { foo: 'bar' } );
		expect( ( await normalized.next() ).value ).toEqual( { ok: true } );
	} );

	it( 'normalizes generator', async () => {
		function* getIterable() {
			yield Promise.resolve( { ok: true } );
		}

		const object = getIterable();
		const normalized = toAsyncIterable( object );

		expect( ( await normalized.next() ).value ).toEqual( { ok: true } );
	} );
} );
