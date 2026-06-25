/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import { describe, expect, it, jest, afterEach } from '@jest/globals';

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

/**
 * Internal dependencies
 */
import { mergeCrdtBlocks, type Block, type YBlock } from '../crdt-blocks';

function tableBlock( rows: string[][] ): Block {
	return {
		name: 'core/table',
		clientId: 'table-1',
		attributes: {
			body: rows.map( ( cells ) => ( {
				cells: cells.map( ( content ) => ( { content, tag: 'td' } ) ),
			} ) ),
		},
		innerBlocks: [],
	};
}

function syncDocs( from: Y.Doc, to: Y.Doc ) {
	Y.applyUpdate( to, Y.encodeStateAsUpdate( from ) );
}

function getTableBody( yblocks: Y.Array< YBlock > ) {
	return yblocks.toJSON()[ 0 ].attributes.body as {
		cells: { content: string }[];
	}[];
}

describe( 'stale query-array block snapshots', () => {
	const docs: Y.Doc[] = [];

	afterEach( () => {
		for ( const doc of docs ) {
			doc.destroy();
		}
		docs.length = 0;
	} );

	function createSyncedDocs( initialRows: string[][] ) {
		const docA = new Y.Doc();
		const docB = new Y.Doc();
		docs.push( docA, docB );

		const yblocksA = docA.getArray< YBlock >();
		const yblocksB = docB.getArray< YBlock >();

		mergeCrdtBlocks( yblocksA, [ tableBlock( initialRows ) ], null );
		syncDocs( docA, docB );

		return { docA, docB, yblocksA, yblocksB };
	}

	it( 'preserves a remote nested cell edit after a stale local cell edit', () => {
		const { docA, docB, yblocksA, yblocksB } = createSyncedDocs( [
			[ 'A1', 'B1' ],
			[ 'A2', 'B2' ],
		] );

		mergeCrdtBlocks(
			yblocksB,
			[
				tableBlock( [
					[ 'A1', 'B1' ],
					[ 'A2', 'remote-B2' ],
				] ),
			],
			null
		);
		syncDocs( docB, docA );
		expect( getTableBody( yblocksA )[ 1 ].cells[ 1 ].content ).toBe(
			'remote-B2'
		);

		mergeCrdtBlocks(
			yblocksA,
			[
				tableBlock( [
					[ 'local-A1', 'B1' ],
					[ 'A2', 'B2' ],
				] ),
			],
			null
		);

		const body = getTableBody( yblocksA );
		expect( body[ 0 ].cells[ 0 ].content ).toBe( 'local-A1' );
		expect( body[ 1 ].cells[ 1 ].content ).toBe( 'remote-B2' );
	} );

	it( 'preserves a remote appended row after a stale local cell edit', () => {
		const { docA, docB, yblocksA, yblocksB } = createSyncedDocs( [
			[ 'A1' ],
			[ 'A2' ],
		] );

		mergeCrdtBlocks(
			yblocksB,
			[ tableBlock( [ [ 'A1' ], [ 'A2' ], [ 'remote-A3' ] ] ) ],
			null
		);
		syncDocs( docB, docA );
		expect( getTableBody( yblocksA ) ).toHaveLength( 3 );

		mergeCrdtBlocks(
			yblocksA,
			[ tableBlock( [ [ 'local-A1' ], [ 'A2' ] ] ) ],
			null
		);

		const body = getTableBody( yblocksA );
		expect( body ).toHaveLength( 3 );
		expect( body[ 0 ].cells[ 0 ].content ).toBe( 'local-A1' );
		expect( body[ 2 ].cells[ 0 ].content ).toBe( 'remote-A3' );
	} );

	it( 'preserves a remote appended row when an explicit base has the row but a stale local snapshot does not', () => {
		const { docA, docB, yblocksA, yblocksB } = createSyncedDocs( [
			[ '' ],
			[ '' ],
		] );

		const explicitBaseWithRemoteRow = [
			tableBlock( [ [ '' ], [ '' ], [ '' ] ] ),
		];

		mergeCrdtBlocks(
			yblocksB,
			[ tableBlock( [ [ '' ], [ '' ], [ '' ] ] ) ],
			null
		);
		syncDocs( docB, docA );
		expect( getTableBody( yblocksA ) ).toHaveLength( 3 );

		mergeCrdtBlocks(
			yblocksA,
			[ tableBlock( [ [ 'local-A1' ], [ '' ] ] ) ],
			{
				attributeKey: 'body.0.cells.0.content',
				clientId: 'table-1',
				offset: 'local-A1'.length,
			},
			explicitBaseWithRemoteRow
		);

		const body = getTableBody( yblocksA );
		expect( body ).toHaveLength( 3 );
		expect( body[ 0 ].cells[ 0 ].content ).toBe( 'local-A1' );
	} );

	it( 'still applies an explicit-base row deletion when no rich-text edit cursor is present', () => {
		const { docA, docB, yblocksA, yblocksB } = createSyncedDocs( [
			[ '' ],
			[ '' ],
		] );

		const explicitBaseWithRemoteRow = [
			tableBlock( [ [ '' ], [ '' ], [ '' ] ] ),
		];

		mergeCrdtBlocks(
			yblocksB,
			[ tableBlock( [ [ '' ], [ '' ], [ '' ] ] ) ],
			null
		);
		syncDocs( docB, docA );
		expect( getTableBody( yblocksA ) ).toHaveLength( 3 );

		mergeCrdtBlocks(
			yblocksA,
			[ tableBlock( [ [ '' ], [ '' ] ] ) ],
			null,
			explicitBaseWithRemoteRow
		);

		expect( getTableBody( yblocksA ) ).toHaveLength( 2 );
	} );

	it( 'does not resurrect a remotely deleted row from a stale local snapshot', () => {
		const { docA, docB, yblocksA, yblocksB } = createSyncedDocs( [
			[ 'A1' ],
			[ 'A2' ],
			[ 'A3' ],
		] );

		mergeCrdtBlocks(
			yblocksB,
			[ tableBlock( [ [ 'A1' ], [ 'A2' ] ] ) ],
			null
		);
		syncDocs( docB, docA );
		expect( getTableBody( yblocksA ) ).toHaveLength( 2 );

		mergeCrdtBlocks(
			yblocksA,
			[ tableBlock( [ [ 'local-A1' ], [ 'A2' ], [ 'A3' ] ] ) ],
			null
		);

		const body = getTableBody( yblocksA );
		expect( body ).toHaveLength( 2 );
		expect( body[ 0 ].cells[ 0 ].content ).toBe( 'local-A1' );
		expect( body.map( ( row ) => row.cells[ 0 ].content ) ).not.toContain(
			'A3'
		);
	} );
} );
