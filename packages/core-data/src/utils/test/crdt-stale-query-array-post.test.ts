/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock( '@wordpress/blocks', () => {
	const actual = jest.requireActual( '@wordpress/blocks' ) as Record<
		string,
		unknown
	>;
	return {
		...actual,
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
	};
} );

/**
 * Internal dependencies
 */
import {
	applyPostChangesToCRDTDoc,
	getPostChangesFromCRDTDoc,
	type PostChanges,
} from '../crdt';
import type { Block } from '../crdt-blocks';
import type { Post } from '../../entity-types';

const syncedProperties = new Set( [ 'blocks' ] );
const RANDOM_SEEDS = Array.from(
	{ length: 24 },
	( _value, index ) => index + 1
);

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

function applyBlocks( doc: Y.Doc, blocks: Block[] ) {
	applyPostChangesToCRDTDoc(
		doc,
		{ blocks } as PostChanges,
		syncedProperties
	);
}

function syncDocs( from: Y.Doc, to: Y.Doc ) {
	Y.applyUpdate( to, Y.encodeStateAsUpdate( from ) );
}

function textValue( value: unknown ): string {
	if ( value instanceof RichTextData ) {
		return value.text;
	}
	return String( value );
}

function getBody( doc: Y.Doc ): string[][] {
	const changes = getPostChangesFromCRDTDoc(
		doc,
		{ blocks: [] } as unknown as Post,
		syncedProperties
	);
	const block = ( changes.blocks as Block[] )[ 0 ];
	const body = block.attributes.body as {
		cells: { content: unknown }[];
	}[];

	return body.map( ( row ) =>
		row.cells.map( ( cell ) => textValue( cell.content ) )
	);
}

function cloneRows( rows: string[][] ): string[][] {
	return rows.map( ( cells ) => [ ...cells ] );
}

/* eslint-disable no-bitwise */
function createSeededRandom( seed: number ) {
	let state = seed >>> 0;

	function next() {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul( value ^ ( value >>> 15 ), value | 1 );
		value ^= value + Math.imul( value ^ ( value >>> 7 ), value | 61 );
		return ( ( value ^ ( value >>> 14 ) ) >>> 0 ) / 0x100000000;
	}

	return {
		int( maxExclusive: number ) {
			return Math.floor( next() * maxExclusive );
		},
		pick< T >( values: readonly T[] ): T {
			return values[ this.int( values.length ) ];
		},
	};
}
/* eslint-enable no-bitwise */

function rowsContain( rows: string[][], value: string ): boolean {
	return rows.some( ( row ) => row.includes( value ) );
}

function runRandomStaleTableScenario( seed: number ) {
	const random = createSeededRandom( seed );
	const docA = new Y.Doc();
	const docB = new Y.Doc();
	const initialRows = [
		[ `seed-${ seed }-A1`, `seed-${ seed }-B1` ],
		[ `seed-${ seed }-A2`, `seed-${ seed }-B2` ],
		[ `seed-${ seed }-A3`, `seed-${ seed }-B3` ],
	];
	const staleLocalRows = cloneRows( initialRows );
	const remoteRows = cloneRows( initialRows );
	const localMarker = `local-${ seed }`;
	const remoteMarker = `remote-${ seed }`;
	const scenario = random.pick( [
		'remote-cell-edit',
		'remote-append-row',
		'remote-prepend-row',
		'remote-delete-row',
	] as const );

	try {
		applyBlocks( docA, [ tableBlock( initialRows ) ] );
		syncDocs( docA, docB );

		switch ( scenario ) {
			case 'remote-cell-edit':
				remoteRows[ 1 ][ 1 ] = remoteMarker;
				break;

			case 'remote-append-row':
				remoteRows.push( [ remoteMarker, `remote-tail-${ seed }` ] );
				break;

			case 'remote-prepend-row':
				remoteRows.unshift( [ remoteMarker, `remote-head-${ seed }` ] );
				break;

			case 'remote-delete-row':
				remoteRows[ 2 ][ 0 ] = remoteMarker;
				applyBlocks( docA, [ tableBlock( remoteRows ) ] );
				syncDocs( docA, docB );
				remoteRows.splice( 2, 1 );
				break;
		}

		applyBlocks( docB, [ tableBlock( remoteRows ) ] );
		syncDocs( docB, docA );

		staleLocalRows[ 0 ][ 0 ] = localMarker;
		applyBlocks( docA, [ tableBlock( staleLocalRows ) ] );

		const body = getBody( docA );
		expect( rowsContain( body, localMarker ) ).toBe( true );

		if ( scenario === 'remote-delete-row' ) {
			expect( rowsContain( body, remoteMarker ) ).toBe( false );
		} else {
			expect( rowsContain( body, remoteMarker ) ).toBe( true );
		}
	} catch ( error ) {
		throw new Error(
			`Stale table scenario failed for seed ${ seed } (${ scenario }): ${
				error instanceof Error ? error.message : String( error )
			}`
		);
	} finally {
		docA.destroy();
		docB.destroy();
	}
}

describe( 'post CRDT stale query-array snapshots', () => {
	const docs: Y.Doc[] = [];

	afterEach( () => {
		for ( const doc of docs ) {
			doc.destroy();
		}
		docs.length = 0;
	} );

	it( 'preserves a remote table cell edit through the post changes adapter', () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();
		docs.push( docA, docB );

		applyBlocks( docA, [
			tableBlock( [
				[ 'A1', 'B1' ],
				[ 'A2', 'B2' ],
			] ),
		] );
		syncDocs( docA, docB );

		applyBlocks( docB, [
			tableBlock( [
				[ 'A1', 'B1' ],
				[ 'A2', 'remote-B2' ],
			] ),
		] );
		syncDocs( docB, docA );
		expect( getBody( docA )[ 1 ][ 1 ] ).toBe( 'remote-B2' );

		applyBlocks( docA, [
			tableBlock( [
				[ 'local-A1', 'B1' ],
				[ 'A2', 'B2' ],
			] ),
		] );

		expect( getBody( docA ) ).toEqual( [
			[ 'local-A1', 'B1' ],
			[ 'A2', 'remote-B2' ],
		] );
	} );

	it.each( RANDOM_SEEDS )(
		'preserves acknowledged remote table operations after a stale local snapshot (seed %i)',
		( seed ) => {
			expect.hasAssertions();
			runRandomStaleTableScenario( seed );
		}
	);
} );
