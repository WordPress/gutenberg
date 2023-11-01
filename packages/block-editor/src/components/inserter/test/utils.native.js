/**
 * Internal dependencies
 */
import { createInserterSection } from '../utils';

describe( 'createInserterSection', () => {
	it( 'returns the expected object shape', () => {
		const key = 'mock-1';
		const items = [ 1, 2, 3 ];
		const metadata = { icon: 'icon-mock', title: 'Title Mock' };

		expect( createInserterSection( { key, metadata, items } ) ).toEqual(
			expect.objectContaining( {
				metadata,
				data: [ { key, list: items } ],
			} )
		);
	} );

	it( 'return always includes metadata', () => {
		const key = 'mock-1';
		const items = [ 1, 2, 3 ];

		expect( createInserterSection( { key, items } ) ).toEqual(
			expect.objectContaining( {
				metadata: {},
				data: [ { key, list: items } ],
			} )
		);
	} );

	it( 'requires a unique key', () => {
		expect( () => {
			createInserterSection( { items: [ 1, 2, 3 ] } );
		} ).toThrow( 'A unique key for the section must be provided.' );
	} );
} );
