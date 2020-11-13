/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom } from '../';

describe( 'atoms', () => {
	it( 'should allow getting and setting atom values', () => {
		const atomCreator = createAtom( 1 );
		const registry = createAtomRegistry();
		const count = registry.getAtom( atomCreator );
		expect( count.get() ).toEqual( 1 );
		count.set( 2 );
		expect( count.get() ).toEqual( 2 );
	} );

	it( 'should allow subscribing to atom changes', () => {
		const atomCreator = createAtom( 1 );
		const registry = createAtomRegistry();
		const count = registry.getAtom( atomCreator );
		const listener = jest.fn();
		count.subscribe( listener );
		expect( count.get() ).toEqual( 1 );
		count.set( 2 ); // listener called once
		expect( count.get() ).toEqual( 2 );
		count.set( 3 ); // listener called once
		expect( count.get() ).toEqual( 3 );
		expect( listener ).toHaveBeenCalledTimes( 2 );
	} );
} );
