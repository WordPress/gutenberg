/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom } from '../';

describe( 'atoms', () => {
	it( 'should allow getting and setting atom values', () => {
		const count = createAtom( 1 );
		const registry = createAtomRegistry();
		expect( registry.get( count ) ).toEqual( 1 );
		registry.set( count, 2 );
		expect( registry.get( count ) ).toEqual( 2 );
	} );

	it( 'should allow subscribing to atom changes', () => {
		const count = createAtom( 1 );
		const registry = createAtomRegistry();
		const listener = jest.fn();
		registry.subscribe( count, listener );
		expect( registry.get( count ) ).toEqual( 1 );
		registry.set( count, 2 ); // listener called once
		expect( registry.get( count ) ).toEqual( 2 );
		registry.set( count, 3 ); // listener called once
		expect( registry.get( count ) ).toEqual( 3 );
		expect( listener ).toHaveBeenCalledTimes( 2 );
	} );
} );
