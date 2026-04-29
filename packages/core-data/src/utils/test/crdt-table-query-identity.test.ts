/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import {
	deserializeBlockAttributes,
	mergeCrdtBlocks,
	type Block,
	type YBlock,
} from '../crdt-blocks';

jest.mock( '@wordpress/blocks', () => ( {
	getBlockTypes: () => [
		{
			name: 'core/table',
			attributes: {
				body: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
							},
						},
					},
				},
			},
		},
	],
} ) );

const INTERNAL_ID_KEY = '__unstableSyncId';

function createTableBlock( values: string[] ): Block {
	return {
		name: 'core/table',
		clientId: 'table',
		attributes: {
			body: values.map( ( value ) => ( {
				cells: [
					{
						content: value,
						tag: 'td',
					},
				],
			} ) ),
		},
		innerBlocks: [],
	};
}

describe( 'CRDT table query array identity', () => {
	function getRuntimeBody( yblocks: Y.Array< YBlock > ) {
		const [ table ] = deserializeBlockAttributes(
			yblocks.toJSON() as Block[]
		);
		return table.attributes.body as Array<
			Record< string, unknown > & {
				cells: Array< Record< string, unknown > >;
			}
		>;
	}

	function getRuntimeCellValues( yblocks: Y.Array< YBlock > ) {
		return getRuntimeBody( yblocks ).map( ( row ) => {
			const content = row.cells[ 0 ].content;
			return typeof content === 'object' &&
				content &&
				'valueOf' in content
				? String( content.valueOf() )
				: content;
		} );
	}

	function getYBody( yblocks: Y.Array< YBlock > ) {
		const [ table ] = yblocks.toJSON() as Block[];
		return table.attributes.body as Array<
			Record< string, unknown > & {
				cells: Array< Record< string, unknown > >;
			}
		>;
	}

	it( 'stores internal identities in the CRDT document only', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray< YBlock >( 'blocks' );

		mergeCrdtBlocks(
			yblocks,
			[ createTableBlock( [ 'anchor', 'same', 'same' ] ) ],
			null
		);

		const yBody = getYBody( yblocks );
		expect( yBody[ 0 ][ INTERNAL_ID_KEY ] ).toEqual( expect.any( String ) );
		expect( yBody[ 1 ][ INTERNAL_ID_KEY ] ).toEqual( expect.any( String ) );
		expect( yBody[ 2 ][ INTERNAL_ID_KEY ] ).toEqual( expect.any( String ) );
		expect( yBody[ 2 ].cells[ 0 ][ INTERNAL_ID_KEY ] ).toEqual(
			expect.any( String )
		);

		const [ table ] = deserializeBlockAttributes(
			yblocks.toJSON() as Block[]
		);
		const body = table.attributes.body as Array<
			Record< string, unknown > & {
				cells: Array< Record< string, unknown > >;
			}
		>;

		expect( body[ 0 ] ).not.toHaveProperty( INTERNAL_ID_KEY );
		expect( body[ 1 ] ).not.toHaveProperty( INTERNAL_ID_KEY );
		expect( body[ 2 ] ).not.toHaveProperty( INTERNAL_ID_KEY );
		expect( body[ 2 ].cells[ 0 ] ).not.toHaveProperty( INTERNAL_ID_KEY );
		expect( JSON.stringify( table.attributes ) ).not.toContain(
			INTERNAL_ID_KEY
		);
	} );

	it( 'preserves CRDT identities when deserialized blocks are merged back', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray< YBlock >( 'blocks' );

		mergeCrdtBlocks(
			yblocks,
			[ createTableBlock( [ 'anchor', 'same', 'same' ] ) ],
			null
		);

		const beforeIds = getYBody( yblocks ).map(
			( row ) => row[ INTERNAL_ID_KEY ]
		);
		const beforeCellIds = getYBody( yblocks ).map(
			( row ) => row.cells[ 0 ][ INTERNAL_ID_KEY ]
		);
		const runtimeBlocks = deserializeBlockAttributes(
			yblocks.toJSON() as Block[]
		);

		mergeCrdtBlocks( yblocks, runtimeBlocks, null );

		expect(
			getYBody( yblocks ).map( ( row ) => row[ INTERNAL_ID_KEY ] )
		).toEqual( beforeIds );
		expect(
			getYBody( yblocks ).map(
				( row ) => row.cells[ 0 ][ INTERNAL_ID_KEY ]
			)
		).toEqual( beforeCellIds );
	} );

	it( 'preserves a later duplicate row edit when the earlier duplicate is deleted', () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();
		const yblocksA = docA.getArray< YBlock >( 'blocks' );
		const yblocksB = docB.getArray< YBlock >( 'blocks' );

		mergeCrdtBlocks(
			yblocksA,
			[ createTableBlock( [ 'anchor', 'same', 'same' ] ) ],
			null
		);
		Y.applyUpdate( docB, Y.encodeStateAsUpdate( docA ) );

		const stateVectorA = Y.encodeStateVector( docA );
		const stateVectorB = Y.encodeStateVector( docB );
		const runtimeBlocksA = deserializeBlockAttributes(
			yblocksA.toJSON() as Block[]
		);
		const runtimeBlocksB = deserializeBlockAttributes(
			yblocksB.toJSON() as Block[]
		);
		const bodyA = runtimeBlocksA[ 0 ].attributes.body as Array< {
			cells: Array< Record< string, unknown > >;
		} >;
		const bodyB = runtimeBlocksB[ 0 ].attributes.body as Array< {
			cells: Array< Record< string, unknown > >;
		} >;

		bodyA[ 2 ].cells[ 0 ].content = 'edited-second-duplicate';
		bodyB.splice( 1, 1 );

		mergeCrdtBlocks( yblocksA, runtimeBlocksA, null );
		mergeCrdtBlocks( yblocksB, runtimeBlocksB, null );

		const updateA = Y.encodeStateAsUpdate( docA, stateVectorB );
		const updateB = Y.encodeStateAsUpdate( docB, stateVectorA );
		Y.applyUpdate( docA, updateB );
		Y.applyUpdate( docB, updateA );

		expect( getRuntimeCellValues( yblocksA ) ).toEqual( [
			'anchor',
			'edited-second-duplicate',
		] );
		expect( getRuntimeCellValues( yblocksB ) ).toEqual( [
			'anchor',
			'edited-second-duplicate',
		] );
	} );
} );
