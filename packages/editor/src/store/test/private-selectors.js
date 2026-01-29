/**
 * Internal dependencies
 */
import { getPostBlocksByName } from '../private-selectors';

describe( 'getPostBlocksByName', () => {
	const state = {
		blocks: {
			byClientId: new Map( [
				[ 'block1', { name: 'core/paragraph' } ],
				[ 'block2', { name: 'core/heading' } ],
				[ 'block3', { name: 'core/paragraph' } ],
				[ 'block4', { name: 'core/query' } ],
				[ 'block5', { name: 'core/paragraph' } ],
				[ 'block6', { name: 'core/heading' } ],
			] ),
			order: new Map( [
				[ '', [ 'block1', 'block2', 'block3', 'block4' ] ],
				[ 'block4', [ 'block5', 'block6' ] ],
			] ),
			parents: new Map( [
				[ 'block1', '' ],
				[ 'block2', '' ],
				[ 'block3', '' ],
				[ 'block4', '' ],
				[ 'block5', 'block4' ],
				[ 'block6', 'block4' ],
			] ),
		},
	};

	getPostBlocksByName.registry = {
		select: () => ( {
			getBlocksByName: ( blockNames ) =>
				Array.from( state.blocks.byClientId.keys() ).filter(
					( clientId ) =>
						blockNames.includes(
							state.blocks.byClientId.get( clientId ).name
						)
				),
			getBlockParents: ( clientId ) => {
				const parents = [];
				let parent = state.blocks.parents.get( clientId );
				while ( parent ) {
					parents.push( parent );
					parent = state.blocks.parents.get( parent );
				}
				return parents;
			},
			getBlockName: ( clientId ) =>
				state.blocks.byClientId.get( clientId ).name,
			getBlocks: () => [],
		} ),
	};

	it( 'should return top-level blocks of the specified name', () => {
		const result = getPostBlocksByName( state, 'core/paragraph' );
		expect( result ).toEqual( [ 'block1', 'block3' ] );
	} );

	it( 'should return an empty array if no blocks match', () => {
		const result = getPostBlocksByName( state, 'core/non-existent' );
		expect( result ).toEqual( [] );
	} );

	it( 'should ignore blocks inside a query block', () => {
		const result = getPostBlocksByName( state, 'core/paragraph' );
		expect( result ).toEqual( [ 'block1', 'block3' ] );
	} );

	it( 'should handle multiple block names', () => {
		const result = getPostBlocksByName( state, [
			'core/paragraph',
			'core/heading',
		] );
		expect( result ).toEqual( [ 'block1', 'block2', 'block3' ] );
	} );
} );
