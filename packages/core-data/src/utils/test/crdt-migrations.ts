/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import { describe, expect, it, jest, afterEach } from '@jest/globals';

/**
 * Mock @wordpress/blocks module with the schemas needed for migration testing.
 */
jest.mock( '@wordpress/blocks', () => ( {
	getBlockTypes: () => [
		{
			name: 'core/paragraph',
			attributes: { content: { type: 'rich-text' } },
		},
		{
			name: 'core/table',
			attributes: {
				hasFixedLayout: { type: 'boolean' },
				caption: { type: 'rich-text' },
				head: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
								scope: { type: 'string' },
								align: { type: 'string' },
							},
						},
					},
				},
				body: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
								scope: { type: 'string' },
								align: { type: 'string' },
							},
						},
					},
				},
				foot: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
								scope: { type: 'string' },
								align: { type: 'string' },
							},
						},
					},
				},
			},
		},
		{
			name: 'core/test-object-query',
			attributes: {
				metadata: {
					type: 'object',
					query: {
						title: { type: 'rich-text' },
						value: { type: 'string' },
					},
				},
			},
		},
		{
			name: 'core/group',
			attributes: {},
		},
	],
} ) );

/**
 * Internal dependencies
 */
import { migrateCRDTDoc } from '../crdt-migrations';
import {
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_VERSION_KEY,
	CRDT_RECORD_MAP_KEY,
} from '../../sync';

/**
 * Helper: create a Y.Doc with the state map version set.
 * @param version
 */
function createDocWithVersion( version: number ): Y.Doc {
	const doc = new Y.Doc();
	const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
	stateMap.set( CRDT_STATE_MAP_VERSION_KEY, version );
	return doc;
}

/**
 * Helper: build a corrupted table block in a Y.Doc where cell content values
 * are stored as plain empty objects (Y.Map) instead of Y.Text.
 *
 * This simulates the pre-fix bug from PR #76597.
 * @param version
 */
function createCorruptedTableDoc( version: number = 1 ): Y.Doc {
	const doc = createDocWithVersion( version );
	const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );

	const blocks = new Y.Array();
	recordMap.set( 'blocks', blocks );

	doc.transact( () => {
		// Build a table block with 2 rows, 2 cells each.
		// Cell content is intentionally stored as empty Y.Map (the bug)
		// instead of Y.Text.
		const cell1 = new Y.Map( [
			[ 'content', new Y.Map() ], // Bug: should be Y.Text
			[ 'tag', 'td' ],
		] as [ string, unknown ][] );

		const cell2 = new Y.Map( [
			[ 'content', new Y.Map() ], // Bug: should be Y.Text
			[ 'tag', 'td' ],
		] as [ string, unknown ][] );

		const cell3 = new Y.Map( [
			[ 'content', new Y.Map() ], // Bug: should be Y.Text
			[ 'tag', 'td' ],
		] as [ string, unknown ][] );

		const cell4 = new Y.Map( [
			[ 'content', new Y.Map() ], // Bug: should be Y.Text
			[ 'tag', 'td' ],
		] as [ string, unknown ][] );

		const row1Cells = new Y.Array();
		row1Cells.insert( 0, [ cell1, cell2 ] );
		const row1 = new Y.Map( [ [ 'cells', row1Cells ] ] as [
			string,
			unknown,
		][] );

		const row2Cells = new Y.Array();
		row2Cells.insert( 0, [ cell3, cell4 ] );
		const row2 = new Y.Map( [ [ 'cells', row2Cells ] ] as [
			string,
			unknown,
		][] );

		const body = new Y.Array();
		body.insert( 0, [ row1, row2 ] );

		const attributes = new Y.Map( [
			[ 'hasFixedLayout', false ],
			[ 'body', body ],
		] as [ string, unknown ][] );

		const tableBlock = new Y.Map( [
			[ 'name', 'core/table' ],
			[ 'attributes', attributes ],
			[ 'innerBlocks', new Y.Array() ],
			[ 'clientId', 'test-table-1' ],
		] as [ string, unknown ][] );

		blocks.insert( 0, [ tableBlock ] );
	} );

	return doc;
}

/**
 * Helper: build a healthy table block in a Y.Doc where cell content values
 * are stored correctly as Y.Text.
 * @param version
 */
function createHealthyTableDoc( version: number = 1 ): Y.Doc {
	const doc = createDocWithVersion( version );
	const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );

	const blocks = new Y.Array();
	recordMap.set( 'blocks', blocks );

	doc.transact( () => {
		const cell1 = new Y.Map( [
			[ 'content', new Y.Text( 'Cell 1' ) ],
			[ 'tag', 'td' ],
		] as [ string, unknown ][] );

		const cell2 = new Y.Map( [
			[ 'content', new Y.Text( 'Cell 2' ) ],
			[ 'tag', 'td' ],
		] as [ string, unknown ][] );

		const row1Cells = new Y.Array();
		row1Cells.insert( 0, [ cell1, cell2 ] );
		const row1 = new Y.Map( [ [ 'cells', row1Cells ] ] as [
			string,
			unknown,
		][] );

		const body = new Y.Array();
		body.insert( 0, [ row1 ] );

		const attributes = new Y.Map( [
			[ 'hasFixedLayout', false ],
			[ 'body', body ],
		] as [ string, unknown ][] );

		const tableBlock = new Y.Map( [
			[ 'name', 'core/table' ],
			[ 'attributes', attributes ],
			[ 'innerBlocks', new Y.Array() ],
			[ 'clientId', 'test-table-1' ],
		] as [ string, unknown ][] );

		blocks.insert( 0, [ tableBlock ] );
	} );

	return doc;
}

describe( 'crdt-migrations', () => {
	let doc: Y.Doc;

	afterEach( () => {
		if ( doc ) {
			doc.destroy();
		}
	} );

	describe( 'migrateCRDTDoc', () => {
		it( 'returns clean and makes no changes when version is current', () => {
			doc = createDocWithVersion( 2 );
			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'clean' );
		} );

		it( 'returns clean when version is ahead of current', () => {
			doc = createDocWithVersion( 99 );
			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'clean' );
		} );

		it( 'runs migrations when doc has no version key set', () => {
			// Simulates a pre-versioning doc where the version key was
			// never written. The ?? 0 fallback should treat it as
			// version 0 and run all migrations.
			doc = new Y.Doc();
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = new Y.Array();
			recordMap.set( 'blocks', blocks );

			doc.transact( () => {
				const cell = new Y.Map( [
					[ 'content', new Y.Map() ],
					[ 'tag', 'td' ],
				] as [ string, unknown ][] );

				const cells = new Y.Array();
				cells.insert( 0, [ cell ] );
				const row = new Y.Map( [ [ 'cells', cells ] ] as [
					string,
					unknown,
				][] );

				const body = new Y.Array();
				body.insert( 0, [ row ] );

				const attributes = new Y.Map( [
					[ 'hasFixedLayout', false ],
					[ 'body', body ],
				] as [ string, unknown ][] );

				const tableBlock = new Y.Map( [
					[ 'name', 'core/table' ],
					[ 'attributes', attributes ],
					[ 'innerBlocks', new Y.Array() ],
					[ 'clientId', 'test-no-version' ],
				] as [ string, unknown ][] );

				blocks.insert( 0, [ tableBlock ] );
			} );

			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'migrated' );

			// Version should be set after migration.
			const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( CRDT_STATE_MAP_VERSION_KEY ) ).toBe( 2 );

			// Cell content should be repaired.
			const tableBlock = (
				recordMap.get( 'blocks' ) as Y.Array< Y.Map< unknown > >
			 ).get( 0 );
			const attrs = tableBlock.get( 'attributes' ) as Y.Map< unknown >;
			const body = attrs.get( 'body' ) as Y.Array< Y.Map< unknown > >;
			const row = body.get( 0 );
			const repairedCells = row.get( 'cells' ) as Y.Array<
				Y.Map< unknown >
			>;
			const content = repairedCells.get( 0 ).get( 'content' );

			expect( content ).toBeInstanceOf( Y.Text );
		} );

		it( 'returns clean when doc has no blocks', () => {
			doc = createDocWithVersion( 1 );
			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'clean' );

			// Version should be updated even when no repair was needed.
			const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( CRDT_STATE_MAP_VERSION_KEY ) ).toBe( 2 );
		} );

		it( 'returns clean for a healthy table doc and updates version', () => {
			doc = createHealthyTableDoc( 1 );
			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'clean' );

			const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( CRDT_STATE_MAP_VERSION_KEY ) ).toBe( 2 );

			// Verify the Y.Text values are still intact.
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = recordMap.get( 'blocks' ) as Y.Array<
				Y.Map< unknown >
			>;
			const tableBlock = blocks.get( 0 );
			const attributes = tableBlock.get(
				'attributes'
			) as Y.Map< unknown >;
			const body = attributes.get( 'body' ) as Y.Array<
				Y.Map< unknown >
			>;
			const row = body.get( 0 );
			const cells = row.get( 'cells' ) as Y.Array< Y.Map< unknown > >;
			const cell = cells.get( 0 );
			const content = cell.get( 'content' );

			expect( content ).toBeInstanceOf( Y.Text );
			expect( ( content as Y.Text ).toString() ).toBe( 'Cell 1' );
		} );

		it( 'repairs corrupted table cells and returns migrated', () => {
			doc = createCorruptedTableDoc( 1 );
			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'migrated' );

			// Verify version was updated.
			const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( CRDT_STATE_MAP_VERSION_KEY ) ).toBe( 2 );

			// Verify all cell content values are now Y.Text.
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = recordMap.get( 'blocks' ) as Y.Array<
				Y.Map< unknown >
			>;
			const tableBlock = blocks.get( 0 );
			const attributes = tableBlock.get(
				'attributes'
			) as Y.Map< unknown >;
			const body = attributes.get( 'body' ) as Y.Array<
				Y.Map< unknown >
			>;

			for ( let rowIdx = 0; rowIdx < body.length; rowIdx++ ) {
				const row = body.get( rowIdx );
				const cells = row.get( 'cells' ) as Y.Array< Y.Map< unknown > >;

				for ( let cellIdx = 0; cellIdx < cells.length; cellIdx++ ) {
					const cell = cells.get( cellIdx );
					const content = cell.get( 'content' );

					expect( content ).toBeInstanceOf( Y.Text );
					expect( ( content as Y.Text ).toString() ).toBe( '' );
				}
			}
		} );

		it( 'handles all three table sections: head, body, foot', () => {
			doc = createDocWithVersion( 1 );
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = new Y.Array();
			recordMap.set( 'blocks', blocks );

			doc.transact( () => {
				// Create one corrupted cell for each section.
				const sections: Record< string, Y.Array< unknown > > = {};

				for ( const section of [ 'head', 'body', 'foot' ] ) {
					const cell = new Y.Map( [
						[ 'content', new Y.Map() ], // Corrupted
						[ 'tag', section === 'head' ? 'th' : 'td' ],
					] as [ string, unknown ][] );

					const cells = new Y.Array();
					cells.insert( 0, [ cell ] );

					const row = new Y.Map( [ [ 'cells', cells ] ] as [
						string,
						unknown,
					][] );

					const arr = new Y.Array();
					arr.insert( 0, [ row ] );
					sections[ section ] = arr;
				}

				const attributes = new Y.Map( [
					[ 'hasFixedLayout', false ],
					[ 'head', sections.head ],
					[ 'body', sections.body ],
					[ 'foot', sections.foot ],
				] as [ string, unknown ][] );

				const tableBlock = new Y.Map( [
					[ 'name', 'core/table' ],
					[ 'attributes', attributes ],
					[ 'innerBlocks', new Y.Array() ],
					[ 'clientId', 'test-table-all-sections' ],
				] as [ string, unknown ][] );

				blocks.insert( 0, [ tableBlock ] );
			} );

			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'migrated' );

			// Verify all three sections were repaired.
			const tableBlock = (
				recordMap.get( 'blocks' ) as Y.Array< Y.Map< unknown > >
			 ).get( 0 );
			const attributes = tableBlock.get(
				'attributes'
			) as Y.Map< unknown >;

			for ( const section of [ 'head', 'body', 'foot' ] ) {
				const sectionArray = attributes.get( section ) as Y.Array<
					Y.Map< unknown >
				>;
				const row = sectionArray.get( 0 );
				const cells = row.get( 'cells' ) as Y.Array< Y.Map< unknown > >;
				const cell = cells.get( 0 );
				const content = cell.get( 'content' );

				expect( content ).toBeInstanceOf( Y.Text );
			}
		} );

		it( 'repairs corrupted table inside innerBlocks', () => {
			doc = createDocWithVersion( 1 );
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = new Y.Array();
			recordMap.set( 'blocks', blocks );

			doc.transact( () => {
				// Build a corrupted table nested inside a group block.
				const cell = new Y.Map( [
					[ 'content', new Y.Map() ], // Corrupted
					[ 'tag', 'td' ],
				] as [ string, unknown ][] );

				const cells = new Y.Array();
				cells.insert( 0, [ cell ] );
				const row = new Y.Map( [ [ 'cells', cells ] ] as [
					string,
					unknown,
				][] );

				const body = new Y.Array();
				body.insert( 0, [ row ] );

				const tableAttributes = new Y.Map( [
					[ 'hasFixedLayout', false ],
					[ 'body', body ],
				] as [ string, unknown ][] );

				const tableBlock = new Y.Map( [
					[ 'name', 'core/table' ],
					[ 'attributes', tableAttributes ],
					[ 'innerBlocks', new Y.Array() ],
					[ 'clientId', 'inner-table-1' ],
				] as [ string, unknown ][] );

				const groupInnerBlocks = new Y.Array();
				groupInnerBlocks.insert( 0, [ tableBlock ] );

				const groupBlock = new Y.Map( [
					[ 'name', 'core/group' ],
					[ 'attributes', new Y.Map() ],
					[ 'innerBlocks', groupInnerBlocks ],
					[ 'clientId', 'group-1' ],
				] as [ string, unknown ][] );

				blocks.insert( 0, [ groupBlock ] );
			} );

			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'migrated' );

			// Verify the nested table cell was repaired.
			const groupBlock = (
				recordMap.get( 'blocks' ) as Y.Array< Y.Map< unknown > >
			 ).get( 0 );
			const innerBlocks = groupBlock.get( 'innerBlocks' ) as Y.Array<
				Y.Map< unknown >
			>;
			const tableBlock = innerBlocks.get( 0 );
			const attributes = tableBlock.get(
				'attributes'
			) as Y.Map< unknown >;
			const body = attributes.get( 'body' ) as Y.Array<
				Y.Map< unknown >
			>;
			const row = body.get( 0 );
			const cells = row.get( 'cells' ) as Y.Array< Y.Map< unknown > >;
			const cell = cells.get( 0 );
			const content = cell.get( 'content' );

			expect( content ).toBeInstanceOf( Y.Text );
		} );

		it( 'repairs table body stored as plain array instead of Y.Array', () => {
			// Pre-#76913 docs stored array+query attributes as plain JS
			// arrays rather than Y.Array. This is the actual corruption
			// pattern found in the wild.
			doc = createDocWithVersion( 1 );
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = new Y.Array();
			recordMap.set( 'blocks', blocks );

			doc.transact( () => {
				const attributes = new Y.Map( [
					[ 'hasFixedLayout', false ],
					[
						'body',
						[
							{
								cells: [
									{ content: {}, tag: 'td' },
									{ content: {}, tag: 'td' },
								],
							},
						],
					],
				] as [ string, unknown ][] );

				const tableBlock = new Y.Map( [
					[ 'name', 'core/table' ],
					[ 'attributes', attributes ],
					[ 'innerBlocks', new Y.Array() ],
					[ 'clientId', 'test-table-plain-array' ],
				] as [ string, unknown ][] );

				blocks.insert( 0, [ tableBlock ] );
			} );

			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'migrated' );

			// The plain array should have been replaced with an empty
			// Y.Array. The invalidation logic will then fill in the
			// correct content from the database.
			const tableBlock = (
				recordMap.get( 'blocks' ) as Y.Array< Y.Map< unknown > >
			 ).get( 0 );
			const attributes = tableBlock.get(
				'attributes'
			) as Y.Map< unknown >;
			const body = attributes.get( 'body' );

			expect( body ).toBeInstanceOf( Y.Array );
		} );

		it( 'is idempotent: second run returns clean with O(1) skip', () => {
			doc = createCorruptedTableDoc( 1 );

			const firstResult = migrateCRDTDoc( doc );
			expect( firstResult ).toBe( 'migrated' );

			const secondResult = migrateCRDTDoc( doc );
			expect( secondResult ).toBe( 'clean' );
		} );

		it( 'repairs top-level rich-text attribute stored as non-Y.Text', () => {
			doc = createDocWithVersion( 1 );
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = new Y.Array();
			recordMap.set( 'blocks', blocks );

			doc.transact( () => {
				// A paragraph block whose content is stored as a plain
				// string instead of Y.Text.
				const attributes = new Y.Map( [
					[ 'content', 'not a Y.Text' ],
				] as [ string, unknown ][] );

				const paragraphBlock = new Y.Map( [
					[ 'name', 'core/paragraph' ],
					[ 'attributes', attributes ],
					[ 'innerBlocks', new Y.Array() ],
					[ 'clientId', 'para-1' ],
				] as [ string, unknown ][] );

				blocks.insert( 0, [ paragraphBlock ] );
			} );

			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'migrated' );

			const block = (
				recordMap.get( 'blocks' ) as Y.Array< Y.Map< unknown > >
			 ).get( 0 );
			const attributes = block.get( 'attributes' ) as Y.Map< unknown >;
			const content = attributes.get( 'content' );

			expect( content ).toBeInstanceOf( Y.Text );
		} );

		it( 'repairs object-query attributes with corrupted rich-text', () => {
			doc = createDocWithVersion( 1 );
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = new Y.Array();
			recordMap.set( 'blocks', blocks );

			doc.transact( () => {
				const metadata = new Y.Map( [
					[ 'title', new Y.Map() ], // Bug: should be Y.Text
					[ 'value', 'plain string is fine' ],
				] as [ string, unknown ][] );

				const attributes = new Y.Map( [ [ 'metadata', metadata ] ] as [
					string,
					unknown,
				][] );

				const block = new Y.Map( [
					[ 'name', 'core/test-object-query' ],
					[ 'attributes', attributes ],
					[ 'innerBlocks', new Y.Array() ],
					[ 'clientId', 'obj-query-1' ],
				] as [ string, unknown ][] );

				blocks.insert( 0, [ block ] );
			} );

			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'migrated' );

			const block = (
				recordMap.get( 'blocks' ) as Y.Array< Y.Map< unknown > >
			 ).get( 0 );
			const attributes = block.get( 'attributes' ) as Y.Map< unknown >;
			const metadata = attributes.get( 'metadata' ) as Y.Map< unknown >;

			expect( metadata.get( 'title' ) ).toBeInstanceOf( Y.Text );
			expect( metadata.get( 'value' ) ).toBe( 'plain string is fine' );
		} );

		it( 'does not modify non-rich-text string attributes', () => {
			doc = createDocWithVersion( 1 );
			const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = new Y.Array();
			recordMap.set( 'blocks', blocks );

			doc.transact( () => {
				// A healthy table where tag values are plain strings (correct).
				const cell = new Y.Map( [
					[ 'content', new Y.Text( 'Hello' ) ],
					[ 'tag', 'td' ],
				] as [ string, unknown ][] );

				const cells = new Y.Array();
				cells.insert( 0, [ cell ] );
				const row = new Y.Map( [ [ 'cells', cells ] ] as [
					string,
					unknown,
				][] );

				const body = new Y.Array();
				body.insert( 0, [ row ] );

				const attributes = new Y.Map( [
					[ 'hasFixedLayout', false ],
					[ 'body', body ],
				] as [ string, unknown ][] );

				const tableBlock = new Y.Map( [
					[ 'name', 'core/table' ],
					[ 'attributes', attributes ],
					[ 'innerBlocks', new Y.Array() ],
					[ 'clientId', 'test-table-clean' ],
				] as [ string, unknown ][] );

				blocks.insert( 0, [ tableBlock ] );
			} );

			const result = migrateCRDTDoc( doc );

			expect( result ).toBe( 'clean' );

			// Verify the tag attribute was not modified.
			const tableBlock = (
				recordMap.get( 'blocks' ) as Y.Array< Y.Map< unknown > >
			 ).get( 0 );
			const attributes = tableBlock.get(
				'attributes'
			) as Y.Map< unknown >;
			const body = attributes.get( 'body' ) as Y.Array<
				Y.Map< unknown >
			>;
			const row = body.get( 0 );
			const cells = row.get( 'cells' ) as Y.Array< Y.Map< unknown > >;
			const cell = cells.get( 0 );

			expect( cell.get( 'tag' ) ).toBe( 'td' );
		} );
	} );
} );
