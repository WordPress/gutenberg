import { describe, expect, it } from 'vitest';
import { filterOutChildClientIds } from '../utils';

describe( 'filterOutChildClientIds', () => {
	const blockParents: Record< string, string[] > = {
		parent: [],
		child: [ 'parent' ],
		grandchild: [ 'parent', 'child' ],
		sibling: [ 'container' ],
		other: [ 'container' ],
	};
	const getBlockParents = ( clientId: string ) =>
		blockParents[ clientId ] ?? [];

	it.each( [
		{ clientIds: [], description: 'an empty list' },
		{ clientIds: [ 'child' ], description: 'a single block' },
		{
			clientIds: [ 'child', 'sibling' ],
			description: 'blocks without a supplied ancestor',
		},
	] )( 'preserves IDs for $description', ( { clientIds } ) => {
		expect( filterOutChildClientIds( clientIds, getBlockParents ) ).toEqual(
			clientIds
		);
	} );

	it.each( [
		{ clientIds: [ 'parent', 'child' ], description: 'parent-first' },
		{ clientIds: [ 'child', 'parent' ], description: 'child-first' },
	] )( 'filters children from $description input', ( { clientIds } ) => {
		expect( filterOutChildClientIds( clientIds, getBlockParents ) ).toEqual(
			[ 'parent' ]
		);
	} );

	it( 'filters deeper descendants when their ancestor is supplied without their immediate parent', () => {
		expect(
			filterOutChildClientIds(
				[ 'grandchild', 'parent' ],
				getBlockParents
			)
		).toEqual( [ 'parent' ] );
	} );

	it( 'preserves the order of retained IDs without mutating the input', () => {
		const clientIds = [
			'sibling',
			'child',
			'parent',
			'grandchild',
			'other',
		];
		Object.freeze( clientIds );

		expect( filterOutChildClientIds( clientIds, getBlockParents ) ).toEqual(
			[ 'sibling', 'parent', 'other' ]
		);
		expect( clientIds ).toEqual( [
			'sibling',
			'child',
			'parent',
			'grandchild',
			'other',
		] );
	} );
} );
