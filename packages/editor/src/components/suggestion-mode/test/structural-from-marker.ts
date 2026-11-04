import { describe, expect, it } from 'vitest';
import { structuralOpFromMarker } from '../operations/structural-from-marker';

const block = ( clientId: string, name = 'core/paragraph' ) => ( {
	clientId,
	name,
	attributes: {},
	innerBlocks: [],
} );

function tree(
	order: Record< string, string[] >,
	parents: Record< string, string | null >,
	names: Record< string, string > = {}
) {
	return {
		getBlock: ( id: string ) => block( id, names[ id ] ),
		getBlockName: ( id: string ) => names[ id ] ?? 'core/paragraph',
		getBlockRootClientId: ( id: string ) => parents[ id ] ?? '',
		getBlockOrder: ( id = '' ) => order[ id ] ?? [],
		getBlockAttributes: () => ( {} ),
	} as any;
}

describe( 'structuralOpFromMarker', () => {
	const t = tree(
		{ '': [ 'a', 'b', 'c', 'g' ], g: [ 'x' ] },
		{ a: null, b: null, c: null, g: null, x: 'g' },
		{ g: 'core/group' }
	);

	it( 'derives block-remove with the live block', () => {
		expect(
			structuralOpFromMarker(
				'b',
				{ type: 'pending-remove', groupId: 'r1' },
				t
			)
		).toEqual( {
			type: 'block-remove',
			clientId: 'b',
			blockName: 'core/paragraph',
			parentBlockName: null,
			groupId: 'r1',
			block: block( 'b' ),
		} );
	} );

	it( 'derives block-insert-after from the live position', () => {
		expect(
			structuralOpFromMarker( 'c', { type: 'pending-insert' }, t )
		).toEqual( {
			type: 'block-insert-after',
			clientId: 'c',
			blockName: 'core/paragraph',
			anchorClientId: 'b',
			parentClientId: null,
			parentBlockName: null,
			block: block( 'c' ),
		} );
		expect(
			structuralOpFromMarker( 'x', { type: 'pending-insert' }, t )
		).toMatchObject( {
			anchorClientId: null,
			parentClientId: 'g',
			parentBlockName: 'core/group',
		} );
	} );

	it( 'derives block-move from the marker origin and the live destination', () => {
		expect(
			structuralOpFromMarker(
				'a',
				{
					type: 'pending-move',
					fromAnchorClientId: 'b',
					fromParentClientId: null,
					fromIndex: 1,
					crossedParents: false,
				},
				t
			)
		).toEqual( {
			type: 'block-move',
			clientId: 'a',
			blockName: 'core/paragraph',
			fromAnchorClientId: 'b',
			fromParentClientId: null,
			fromIndex: 1,
			crossedParents: false,
			toAnchorClientId: null,
			toParentClientId: null,
		} );
	} );

	it( 'carries a cross-parent move and its dissolved parent record', () => {
		expect(
			structuralOpFromMarker(
				'x',
				{
					type: 'pending-move',
					fromAnchorClientId: null,
					fromParentClientId: 'old',
					fromIndex: 0,
					crossedParents: true,
					fromParentBlock: { parentClientId: null, index: 2 },
				},
				t
			)
		).toEqual( {
			type: 'block-move',
			clientId: 'x',
			blockName: 'core/paragraph',
			fromAnchorClientId: null,
			fromParentClientId: 'old',
			fromIndex: 0,
			crossedParents: true,
			toAnchorClientId: null,
			toParentClientId: 'g',
			fromParentBlock: { parentClientId: null, index: 2 },
		} );
	} );

	it( 'returns null for pending-attributes and for a block that is gone', () => {
		expect(
			structuralOpFromMarker(
				'a',
				{ type: 'pending-attributes', after: { level: 3 } },
				t
			)
		).toBeNull();
		const gone = { ...t, getBlock: () => undefined };
		expect(
			structuralOpFromMarker( 'zz', { type: 'pending-remove' }, gone )
		).toBeNull();
	} );
} );
