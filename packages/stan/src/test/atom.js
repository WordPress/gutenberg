/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom } from '../';

describe( 'atoms', () => {
	it( 'should allow getting and setting atom values', async () => {
		const count = createAtom( 1 );
		const registry = createAtomRegistry();
		expect( await registry.get( count ) ).toEqual( 1 );
		await registry.set( count, 2 );
		expect( await registry.get( count ) ).toEqual( 2 );
	} );

	it( 'should allow subscribing to atom changes', async () => {
		const count = createAtom( 1 );
		const registry = createAtomRegistry();
		const listener = jest.fn();
		await registry.subscribe( count, listener );
		expect( await registry.get( count ) ).toEqual( 1 );
		await registry.set( count, 2 );
		expect( listener ).toHaveBeenCalledTimes( 1 );
		expect( await registry.get( count ) ).toEqual( 2 );
		await registry.set( count, 3 );
		expect( listener ).toHaveBeenCalledTimes( 2 );
		expect( await registry.get( count ) ).toEqual( 3 );
	} );
} );
