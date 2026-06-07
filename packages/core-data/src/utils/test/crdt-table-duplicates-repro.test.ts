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

function getRuntimeTableBody( blocks: Block[] ) {
	return blocks[ 0 ].attributes.body as Array< {
		cells: Array< Record< string, unknown > >;
	} >;
}

function getCellContentText( content: unknown ) {
	return typeof content === 'object' && content && 'valueOf' in content
		? String( content.valueOf() )
		: content;
}

function getTableBodyCellContents( yblocks: Y.Array< YBlock > ) {
	const blocks = deserializeBlockAttributes( yblocks.toJSON() as Block[] );
	return getRuntimeTableBody( blocks ).map( ( row ) =>
		getCellContentText( row.cells[ 0 ].content )
	);
}

describe( 'CRDT duplicate table row repro', () => {
	it( 'converges when one user edits the later duplicate row and another deletes the earlier duplicate row', () => {
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

		getRuntimeTableBody( runtimeBlocksA )[ 2 ].cells[ 0 ].content =
			'edited-second-duplicate';
		getRuntimeTableBody( runtimeBlocksB ).splice( 1, 1 );

		mergeCrdtBlocks( yblocksA, runtimeBlocksA, null );
		mergeCrdtBlocks( yblocksB, runtimeBlocksB, null );

		const updateA = Y.encodeStateAsUpdate( docA, stateVectorB );
		const updateB = Y.encodeStateAsUpdate( docB, stateVectorA );
		Y.applyUpdate( docA, updateB );
		Y.applyUpdate( docB, updateA );

		expect( getTableBodyCellContents( yblocksA ) ).toEqual( [
			'anchor',
			'edited-second-duplicate',
		] );
		expect( getTableBodyCellContents( yblocksB ) ).toEqual( [
			'anchor',
			'edited-second-duplicate',
		] );
	} );
} );
