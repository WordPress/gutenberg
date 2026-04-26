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
	it( 'adds internal identities to nested query array elements', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray< YBlock >( 'blocks' );

		mergeCrdtBlocks(
			yblocks,
			[ createTableBlock( [ 'anchor', 'same', 'same' ] ) ],
			null
		);

		const [ table ] = deserializeBlockAttributes(
			yblocks.toJSON() as Block[]
		);
		const body = table.attributes.body as Array<
			Record< string, unknown > & {
				cells: Array< Record< string, unknown > >;
			}
		>;

		expect( body[ 0 ][ INTERNAL_ID_KEY ] ).toEqual(
			expect.any( String )
		);
		expect( body[ 1 ][ INTERNAL_ID_KEY ] ).toEqual(
			expect.any( String )
		);
		expect( body[ 2 ][ INTERNAL_ID_KEY ] ).toEqual(
			expect.any( String )
		);
		expect( body[ 2 ].cells[ 0 ][ INTERNAL_ID_KEY ] ).toEqual(
			expect.any( String )
		);
	} );
} );
