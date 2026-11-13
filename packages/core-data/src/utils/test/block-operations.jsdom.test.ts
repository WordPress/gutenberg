import { describe, expect, it } from 'vitest';
import type { Block } from '@wordpress/blocks';
import { Y } from '@wordpress/sync';
import { diffBlockOperations } from '../block-operations';
import { applyCrdtBlockOperation, type YBlock } from '../crdt-blocks';

const block = ( clientId: string, innerBlocks: Block[] = [] ): Block => ( {
	clientId,
	name: 'core/paragraph',
	attributes: { content: clientId },
	innerBlocks,
	isValid: true,
} );

// Replay through the Yjs adapter, independently of the producer's conversion.
function replay( previous: Block[], next: Block[] ) {
	const doc = new Y.Doc();
	const blocks = doc.getArray< YBlock >( 'blocks' );
	for ( const item of previous ) {
		applyCrdtBlockOperation( blocks, {
			type: 'insert',
			block: item,
			parent: null,
			before: null,
		} );
	}
	const operations = diffBlockOperations( previous, next );
	doc.transact( () => {
		for ( const operation of operations ) {
			applyCrdtBlockOperation( blocks, operation );
		}
	} );
	expect( blocks.toJSON() ).toEqual( next );
	doc.destroy();
	return operations;
}

describe( 'state-based block setters', () => {
	it( 'preserves existing blocks when adding and reordering nested blocks', () => {
		const a = block( 'a' ),
			b = block( 'b' ),
			c = block( 'c' );
		const operations = replay(
			[ block( 'parent', [ a, b ] ), c ],
			[ c, block( 'parent', [ b, block( 'new' ), a ] ) ]
		);
		expect(
			operations.filter( ( operation ) => operation.type === 'remove' )
		).toEqual( [] );
	} );

	it( 'moves a retained child out before removing its parent', () => {
		const child = block( 'child' );
		expect( replay( [ block( 'parent', [ child ] ) ], [ child ] ) ).toEqual(
			[
				{ type: 'move', clientId: 'child', parent: null, before: null },
				{ type: 'remove', clientId: 'parent' },
			]
		);
	} );

	it( 'wraps existing blocks without deleting their identities', () => {
		const a = block( 'a' ),
			b = block( 'b' );
		const operations = replay( [ a, b ], [ block( 'wrapper', [ a, b ] ) ] );
		expect(
			operations.filter( ( operation ) => operation.type === 'remove' )
		).toEqual( [] );
		expect(
			operations.filter( ( operation ) => operation.type === 'insert' )
		).toEqual( [
			{
				type: 'insert',
				block: block( 'wrapper' ),
				parent: null,
				before: null,
			},
		] );
	} );

	it( 'reverses an ancestor relationship without creating a cycle', () => {
		expect(
			replay(
				[ block( 'a', [ block( 'b' ) ] ) ],
				[ block( 'b', [ block( 'a' ) ] ) ]
			)
		).toEqual( [
			{ type: 'move', clientId: 'b', parent: null, before: null },
			{ type: 'move', clientId: 'a', parent: 'b', before: null },
		] );
	} );

	it( 'replaces blocks and applies type and attribute changes to retained IDs', () => {
		const a = block( 'a' );
		const next = { ...a, name: 'core/heading', attributes: { level: 2 } };
		expect(
			replay( [ a, block( 'removed' ) ], [ next, block( 'new' ) ] )
		).toContainEqual( {
			type: 'set-block-property',
			clientId: 'a',
			property: 'name',
			previousValue: 'core/paragraph',
			value: 'core/heading',
		} );
	} );

	it( 'preserves the previous text value and omits unchanged attributes', () => {
		const a = block( 'a' );
		expect(
			replay( [ a ], [ { ...a, attributes: { content: 'typed' } } ] )
		).toEqual( [
			{
				type: 'set-attribute',
				clientId: 'a',
				attribute: 'content',
				previousValue: 'a',
				value: 'typed',
			},
		] );
		expect(
			diffBlockOperations(
				[ a ],
				[ { ...a, attributes: { ...a.attributes } } ]
			)
		).toEqual( [] );
	} );

	it( 'clears the document with subtree removals', () => {
		expect(
			replay( [ block( 'a', [ block( 'child' ) ] ), block( 'b' ) ], [] )
		).toEqual( [
			{ type: 'remove', clientId: 'a' },
			{ type: 'remove', clientId: 'b' },
		] );
	} );
} );
