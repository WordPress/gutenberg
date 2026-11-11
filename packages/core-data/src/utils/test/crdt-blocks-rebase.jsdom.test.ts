import { describe, expect, it, vi } from 'vitest';
import { Y } from '@wordpress/sync';
import {
	mergeCrdtBlocks,
	rebaseCrdtBlocks,
	rebaseRichTextUpdate,
	type Block,
	type YBlock,
	type YBlocks,
} from '../crdt-blocks';
import { asRichTextOffset } from '../crdt-utils';
import type { WPBlockSelection } from '../../types';

vi.mock( import( 'uuid' ), () => ( {
	v4: () => 'mocked-uuid-' + Math.random(),
} ) );

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getBlockTypes: ( () => [
		{
			name: 'core/paragraph',
			attributes: {
				content: { type: 'rich-text' },
				align: { type: 'string' },
				dropCap: { type: 'boolean' },
			},
		},
		{
			name: 'core/group',
			attributes: {},
		},
	] ) as unknown as typeof import( '@wordpress/blocks' ).getBlockTypes,
} ) );

function paragraph(
	clientId: string,
	content: string,
	attributes: Record< string, unknown > = {}
): Block {
	return {
		name: 'core/paragraph',
		attributes: { content, ...attributes },
		innerBlocks: [],
		clientId,
	};
}

function group( clientId: string, innerBlocks: Block[] ): Block {
	return { name: 'core/group', attributes: {}, innerBlocks, clientId };
}

function cursor( clientId: string, offset: number ): WPBlockSelection {
	return {
		clientId,
		attributeKey: 'content',
		offset: asRichTextOffset( offset ),
	};
}

// Relay every update between two docs, like a lossless room. Nothing is
// dropped or reordered: the divergence below comes from the editor alone.
function connect( a: Y.Doc, b: Y.Doc ): void {
	a.on( 'update', ( update: Uint8Array, origin: unknown ) => {
		if ( origin !== 'relay' ) {
			Y.applyUpdate( b, update, 'relay' );
		}
	} );
	b.on( 'update', ( update: Uint8Array, origin: unknown ) => {
		if ( origin !== 'relay' ) {
			Y.applyUpdate( a, update, 'relay' );
		}
	} );
}

function snapshot( yblocks: YBlocks ) {
	return yblocks.toArray().map( ( yblock ) => ( {
		id: yblock.get( 'clientId' ),
		content: yblock.get( 'attributes' )?.get( 'content' )?.toString(),
	} ) );
}

function createPeers() {
	const docA = new Y.Doc();
	const docB = new Y.Doc();
	connect( docA, docB );
	return {
		yA: docA.getArray< YBlock >( 'blocks' ),
		yB: docB.getArray< YBlock >( 'blocks' ),
	};
}

describe( 'rebaseCrdtBlocks', () => {
	describe( 'a keystroke on an editor that lags the document', () => {
		it( 'keeps a paragraph a peer added, where the positional merge deletes it', () => {
			const { yA, yB } = createPeers();
			const p1 = paragraph( 'p1', 'Hello' );
			mergeCrdtBlocks( yA, [ p1 ], null );

			// B adds a paragraph. The update reaches A's doc at once, but A's
			// block editor has not rendered it yet.
			const bPreviousBlocks = [ paragraph( 'p1', 'Hello' ) ];
			const bBlocks = [
				paragraph( 'p1', 'Hello' ),
				paragraph( 'p2', 'World' ),
			];
			rebaseCrdtBlocks( yB, bPreviousBlocks, bBlocks, null );
			expect( yA.length ).toBe( 2 );

			// A types in p1 against the list it last rendered: just p1.
			rebaseCrdtBlocks(
				yA,
				[ p1 ],
				[ paragraph( 'p1', 'Hello!' ) ],
				cursor( 'p1', 6 )
			);

			const expected = [
				{ id: 'p1', content: 'Hello!' },
				{ id: 'p2', content: 'World' },
			];
			expect( snapshot( yA ) ).toEqual( expected );
			expect( snapshot( yB ) ).toEqual( expected );

			// B keeps typing in p2 before it rendered A's "!". Its paragraph
			// is updated in place: no duplicate, and A's edit survives.
			rebaseCrdtBlocks(
				yB,
				bBlocks,
				[ paragraph( 'p1', 'Hello' ), paragraph( 'p2', 'World!' ) ],
				cursor( 'p2', 6 )
			);
			const converged = [
				{ id: 'p1', content: 'Hello!' },
				{ id: 'p2', content: 'World!' },
			];
			expect( snapshot( yA ) ).toEqual( converged );
			expect( snapshot( yB ) ).toEqual( converged );
			expect( yA.length ).toBe( 2 );
		} );

		it( 'keeps characters a peer typed after the cursor in the same paragraph', () => {
			const { yA, yB } = createPeers();
			const base = paragraph( 'p1', 'President Donald' );
			mergeCrdtBlocks( yA, [ base ], null );

			rebaseCrdtBlocks(
				yB,
				[ base ],
				[ paragraph( 'p1', 'President Donald Trump' ) ],
				cursor( 'p1', 22 )
			);

			// A deletes one letter against the text it last rendered.
			rebaseCrdtBlocks(
				yA,
				[ base ],
				[ paragraph( 'p1', 'President Donld' ) ],
				cursor( 'p1', 13 )
			);

			expect( snapshot( yB )[ 0 ].content ).toBe(
				'President Donld Trump'
			);
		} );

		it( 'keeps characters a peer typed before the cursor in the same paragraph', () => {
			const { yA, yB } = createPeers();
			const base = paragraph( 'p1', 'Hello world' );
			mergeCrdtBlocks( yA, [ base ], null );

			rebaseCrdtBlocks(
				yB,
				[ base ],
				[ paragraph( 'p1', 'Oh, Hello world' ) ],
				cursor( 'p1', 4 )
			);

			// A deletes the final letter against "Hello world".
			rebaseCrdtBlocks(
				yA,
				[ base ],
				[ paragraph( 'p1', 'Hello worl' ) ],
				cursor( 'p1', 10 )
			);

			expect( snapshot( yB )[ 0 ].content ).toBe( 'Oh, Hello worl' );
		} );

		it( 'keeps an attribute a peer added while removing one the editor removed', () => {
			const { yA, yB } = createPeers();
			const base = paragraph( 'p1', 'Hello', { align: 'left' } );
			mergeCrdtBlocks( yA, [ base ], null );

			rebaseCrdtBlocks(
				yB,
				[ base ],
				[
					paragraph( 'p1', 'Hello', {
						align: 'left',
						dropCap: true,
					} ),
				],
				null
			);

			rebaseCrdtBlocks(
				yA,
				[ base ],
				[ paragraph( 'p1', 'Hello' ) ],
				null
			);

			const attributes = yB.get( 0 ).get( 'attributes' )!;
			expect( attributes.has( 'align' ) ).toBe( false );
			expect( attributes.get( 'dropCap' ) ).toBe( true );
		} );

		it( 'keeps an inner block a peer added to a group', () => {
			const { yA, yB } = createPeers();
			const inner1 = paragraph( 'i1', 'One' );
			const base = group( 'g1', [ inner1 ] );
			mergeCrdtBlocks( yA, [ base ], null );

			rebaseCrdtBlocks(
				yB,
				[ base ],
				[ group( 'g1', [ inner1, paragraph( 'i2', 'Two' ) ] ) ],
				null
			);

			rebaseCrdtBlocks(
				yA,
				[ base ],
				[ group( 'g1', [ paragraph( 'i1', 'One!' ) ] ) ],
				cursor( 'i1', 4 )
			);

			const inner = yB.get( 0 ).get( 'innerBlocks' ) as YBlocks;
			expect( snapshot( inner ) ).toEqual( [
				{ id: 'i1', content: 'One!' },
				{ id: 'i2', content: 'Two' },
			] );
		} );

		it( 'keeps an inner block a peer added to an empty group', () => {
			const { yA, yB } = createPeers();
			const emptyGroup = group( 'g1', [] );
			const p1 = paragraph( 'p1', 'Hello' );
			mergeCrdtBlocks( yA, [ emptyGroup, p1 ], null );

			rebaseCrdtBlocks(
				yB,
				[ emptyGroup, p1 ],
				[ group( 'g1', [ paragraph( 'i1', 'Inner' ) ] ), p1 ],
				null
			);
			expect(
				( yA.get( 0 ).get( 'innerBlocks' ) as YBlocks ).length
			).toBe( 1 );

			// A types in p1 against the list it last rendered, where the
			// group is still empty.
			rebaseCrdtBlocks(
				yA,
				[ emptyGroup, p1 ],
				[ group( 'g1', [] ), paragraph( 'p1', 'Hello!' ) ],
				cursor( 'p1', 6 )
			);

			const inner = yB.get( 0 ).get( 'innerBlocks' ) as YBlocks;
			expect( snapshot( inner ) ).toEqual( [
				{ id: 'i1', content: 'Inner' },
			] );
			expect( snapshot( yB )[ 1 ] ).toEqual( {
				id: 'p1',
				content: 'Hello!',
			} );
		} );

		it( 'leaves a block a peer deleted deleted while rebasing the rest', () => {
			const { yA, yB } = createPeers();
			const p1 = paragraph( 'p1', 'One' );
			const p2 = paragraph( 'p2', 'Two' );
			const p3 = paragraph( 'p3', 'Three' );
			mergeCrdtBlocks( yA, [ p1, p2, p3 ], null );

			// B deletes p2 and types in p3. A has rendered neither.
			rebaseCrdtBlocks(
				yB,
				[ p1, p2, p3 ],
				[ p1, paragraph( 'p3', 'Three!' ) ],
				cursor( 'p3', 6 )
			);

			// A types in p1 against the list it last rendered.
			rebaseCrdtBlocks(
				yA,
				[ p1, p2, p3 ],
				[ paragraph( 'p1', 'One!' ), p2, p3 ],
				cursor( 'p1', 4 )
			);

			const expected = [
				{ id: 'p1', content: 'One!' },
				{ id: 'p3', content: 'Three!' },
			];
			expect( snapshot( yA ) ).toEqual( expected );
			expect( snapshot( yB ) ).toEqual( expected );
		} );

		it( 're-creates a block a peer deleted when the editor changed it since', () => {
			const { yA, yB } = createPeers();
			const p1 = paragraph( 'p1', 'One' );
			const p2 = paragraph( 'p2', 'Two' );
			mergeCrdtBlocks( yA, [ p1, p2 ], null );

			rebaseCrdtBlocks( yB, [ p1, p2 ], [ p1 ], null );
			expect( yA.length ).toBe( 1 );

			rebaseCrdtBlocks(
				yA,
				[ p1, p2 ],
				[ p1, paragraph( 'p2', 'Two!' ) ],
				cursor( 'p2', 4 )
			);

			const expected = [
				{ id: 'p1', content: 'One' },
				{ id: 'p2', content: 'Two!' },
			];
			expect( snapshot( yA ) ).toEqual( expected );
			expect( snapshot( yB ) ).toEqual( expected );
		} );
	} );

	describe( 'ordinary edits', () => {
		it( 'keeps a peer reorder when the editor only changes text', () => {
			const { yA, yB } = createPeers();
			const a = paragraph( 'a', 'A' );
			const b = paragraph( 'b', 'B' );
			mergeCrdtBlocks( yA, [ a, b ], null );
			rebaseCrdtBlocks( yB, [ a, b ], [ b, a ], null );
			rebaseCrdtBlocks(
				yA,
				[ a, b ],
				[ paragraph( 'a', 'A!' ), b ],
				null
			);
			expect( snapshot( yA ) ).toEqual( [
				{ id: 'b', content: 'B' },
				{ id: 'a', content: 'A!' },
			] );
		} );

		it( 'keeps a peer replacement when no previous block remains', () => {
			const { yA, yB } = createPeers();
			const a = paragraph( 'a', 'A' );
			const b = paragraph( 'b', 'B' );
			mergeCrdtBlocks( yA, [ a ], null );
			rebaseCrdtBlocks( yB, [ a ], [ b ], null );
			rebaseCrdtBlocks( yA, [ a ], [ paragraph( 'a', 'A!' ) ], null );
			expect( snapshot( yA ) ).toEqual( [
				{ id: 'a', content: 'A!' },
				{ id: 'b', content: 'B' },
			] );
		} );

		it( 'inserts a new block right after its predecessor', () => {
			const { yA, yB } = createPeers();
			const a = paragraph( 'a', 'A' );
			mergeCrdtBlocks( yA, [ a ], null );
			// A block A has not seen.
			rebaseCrdtBlocks( yB, [ a ], [ a, paragraph( 'x', 'X' ) ], null );

			rebaseCrdtBlocks( yA, [ a ], [ a, paragraph( 'n', 'N' ) ], null );

			expect( snapshot( yA ).map( ( b ) => b.id ) ).toEqual( [
				'a',
				'n',
				'x',
			] );
		} );

		it( 'deletes a block the editor removed and nothing else', () => {
			const { yA, yB } = createPeers();
			const a = paragraph( 'a', 'A' );
			const b = paragraph( 'b', 'B' );
			mergeCrdtBlocks( yA, [ a, b ], null );
			rebaseCrdtBlocks(
				yB,
				[ a, b ],
				[ a, b, paragraph( 'x', 'X' ) ],
				null
			);

			rebaseCrdtBlocks( yA, [ a, b ], [ a ], null );

			expect( snapshot( yA ).map( ( block ) => block.id ) ).toEqual( [
				'a',
				'x',
			] );
		} );

		it( 'reorders blocks the editor moved', () => {
			const doc = new Y.Doc();
			const yblocks = doc.getArray< YBlock >( 'blocks' );
			const a = paragraph( 'a', 'A' );
			const b = paragraph( 'b', 'B' );
			const c = paragraph( 'c', 'C' );
			mergeCrdtBlocks( yblocks, [ a, b, c ], null );

			rebaseCrdtBlocks( yblocks, [ a, b, c ], [ c, a, b ], null );

			expect( snapshot( yblocks ) ).toEqual( [
				{ id: 'c', content: 'C' },
				{ id: 'a', content: 'A' },
				{ id: 'b', content: 'B' },
			] );
		} );

		it( 'updates block properties other than attributes', () => {
			const doc = new Y.Doc();
			const yblocks = doc.getArray< YBlock >( 'blocks' );
			const a = { ...paragraph( 'a', 'A' ), isValid: true };
			mergeCrdtBlocks( yblocks, [ a ], null );

			rebaseCrdtBlocks(
				yblocks,
				[ a ],
				[ { ...a, isValid: false } ],
				null
			);

			expect( yblocks.get( 0 ).get( 'isValid' ) ).toBe( false );
		} );
	} );

	describe( 'moves between containers', () => {
		const layouts = {
			newParent: ( p: Block ) => [ group( 'g3', [ p ] ) ],
			root: ( p: Block ) => [ group( 'g1', [] ), group( 'g2', [] ), p ],
			first: ( p: Block ) => [ group( 'g1', [ p ] ), group( 'g2', [] ) ],
			second: ( p: Block ) => [ group( 'g1', [] ), group( 'g2', [ p ] ) ],
		};
		it.each( [
			[ 'root', 'first' ],
			[ 'first', 'root' ],
			[ 'first', 'second' ],
			[ 'second', 'first' ],
			[ 'root', 'newParent' ],
			[ 'first', 'newParent' ],
		] as const )(
			'keeps one edited paragraph when a peer moves it from %s to %s',
			( from, to ) => {
				const { yA, yB } = createPeers();
				const p = paragraph( 'p', 'hello' );
				const previous = layouts[ from ]( p );
				mergeCrdtBlocks( yA, previous, null );
				rebaseCrdtBlocks( yB, previous, layouts[ to ]( p ), null );
				rebaseCrdtBlocks(
					yA,
					previous,
					layouts[ from ]( paragraph( 'p', 'hello!' ) ),
					cursor( 'p', 6 )
				);
				const expected = layouts[ to ]( paragraph( 'p', 'hello!' ) );
				expect( yA.toJSON() ).toEqual( expected );
				expect( yB.toJSON() ).toEqual( expected );
			}
		);
		it.each( [
			[ 'root', 'first' ],
			[ 'first', 'root' ],
			[ 'first', 'second' ],
			[ 'second', 'first' ],
			[ 'root', 'newParent' ],
			[ 'first', 'newParent' ],
		] as const )(
			'keeps peer text when the editor moves a paragraph from %s to %s',
			( from, to ) => {
				const { yA, yB } = createPeers();
				const p = paragraph( 'p', 'hello' );
				const previous = layouts[ from ]( p );
				mergeCrdtBlocks( yA, previous, null );
				rebaseCrdtBlocks(
					yB,
					previous,
					layouts[ from ]( paragraph( 'p', 'ABChello' ) ),
					null
				);
				rebaseCrdtBlocks(
					yA,
					previous,
					layouts[ to ]( paragraph( 'p', 'hello!' ) ),
					cursor( 'p', 6 )
				);
				const expected = layouts[ to ]( paragraph( 'p', 'ABChello!' ) );
				expect( yA.toJSON() ).toEqual( expected );
				expect( yB.toJSON() ).toEqual( expected );
			}
		);
		it( 'deletes a paragraph the peer moved to a different container', () => {
			const { yA, yB } = createPeers();
			const p = paragraph( 'p', 'hello' );
			const previous = layouts.root( p );
			mergeCrdtBlocks( yA, previous, null );
			rebaseCrdtBlocks( yB, previous, layouts.first( p ), null );
			rebaseCrdtBlocks(
				yA,
				previous,
				[ group( 'g1', [] ), group( 'g2', [] ) ],
				null
			);
			expect( yA.toJSON() ).toEqual( [
				group( 'g1', [] ),
				group( 'g2', [] ),
			] );
			expect( yB.toJSON() ).toEqual( yA.toJSON() );
		} );
	} );

	describe( 'concurrent moves between containers', () => {
		it.each( [ 'g1', 'g2' ] )(
			'keeps one paragraph with both edits when the editor moves it to %s after a peer moved it to g1',
			( destination ) => {
				const { yA, yB } = createPeers();
				const previous = [
					group( 'g1', [] ),
					group( 'g2', [] ),
					paragraph( 'p', 'hello' ),
				];
				mergeCrdtBlocks( yA, previous, null );
				rebaseCrdtBlocks(
					yB,
					previous,
					[
						group( 'g1', [ paragraph( 'p', 'ABChello' ) ] ),
						group( 'g2', [] ),
					],
					null
				);
				const atDestination = ( content: string ) =>
					[ 'g1', 'g2' ].map( ( id ) =>
						group(
							id,
							id === destination
								? [ paragraph( 'p', content ) ]
								: []
						)
					);
				rebaseCrdtBlocks(
					yA,
					previous,
					atDestination( 'hello!' ),
					cursor( 'p', 6 )
				);
				expect( yA.toJSON() ).toEqual( atDestination( 'ABChello!' ) );
				expect( yB.toJSON() ).toEqual( yA.toJSON() );
			}
		);
	} );

	describe( 'fallback to the positional merge', () => {
		it( 'reconciles by position when the previous blocks carry client IDs the document does not know', () => {
			const doc = new Y.Doc();
			const yblocks = doc.getArray< YBlock >( 'blocks' );
			mergeCrdtBlocks( yblocks, [ paragraph( 'p1', 'Hello' ) ], null );

			// Right after a load the editor's parsed blocks have fresh IDs.
			rebaseCrdtBlocks(
				yblocks,
				[ paragraph( 'q1', 'Hello' ) ],
				[ paragraph( 'q1', 'Hello!' ) ],
				cursor( 'q1', 6 )
			);

			expect( snapshot( yblocks ) ).toEqual( [
				{ id: 'q1', content: 'Hello!' },
			] );
		} );

		it( 'keeps a peer paragraph added while the editor still saw an empty document', () => {
			const doc = new Y.Doc();
			const yblocks = doc.getArray< YBlock >( 'blocks' );
			mergeCrdtBlocks( yblocks, [ paragraph( 'p1', 'Hello' ) ], null );

			rebaseCrdtBlocks(
				yblocks,
				[],
				[ paragraph( 'q1', 'Hello' ) ],
				null
			);

			expect( snapshot( yblocks ) ).toEqual( [
				{ id: 'q1', content: 'Hello' },
				{ id: 'p1', content: 'Hello' },
			] );
		} );

		it( 'reconciles by position when there is no previous blocks', () => {
			const doc = new Y.Doc();
			const yblocks = doc.getArray< YBlock >( 'blocks' );
			mergeCrdtBlocks( yblocks, [ paragraph( 'p1', 'Hello' ) ], null );

			rebaseCrdtBlocks(
				yblocks,
				undefined,
				[ paragraph( 'q1', 'Hello!' ) ],
				cursor( 'q1', 6 )
			);

			expect( snapshot( yblocks ) ).toEqual( [
				{ id: 'q1', content: 'Hello!' },
			] );
		} );

		it( 'is a no-op when the previous blocks are the incoming list', () => {
			const doc = new Y.Doc();
			const yblocks = doc.getArray< YBlock >( 'blocks' );
			const blocks = [ paragraph( 'p1', 'Hello' ) ];
			mergeCrdtBlocks( yblocks, blocks, null );
			const before = snapshot( yblocks );

			rebaseCrdtBlocks( yblocks, blocks, blocks, null );

			expect( snapshot( yblocks ) ).toEqual( before );
		} );
	} );
} );

describe( 'rebaseRichTextUpdate', () => {
	function createText( value: string ): Y.Text {
		const doc = new Y.Doc();
		const text = doc.getText( 'text' );
		text.insert( 0, value );
		return text;
	}

	it( 'applies the edit directly when the text has not moved', () => {
		const text = createText( 'Hello' );
		rebaseRichTextUpdate( text, 'Hello', 'Hello!', null );
		expect( text.toString() ).toBe( 'Hello!' );
	} );

	it( 'transforms an insertion over a concurrent insertion before it', () => {
		const text = createText( 'AB Hello' );
		rebaseRichTextUpdate( text, 'Hello', 'Hello!', null );
		expect( text.toString() ).toBe( 'AB Hello!' );
	} );

	it( 'transforms a deletion over a concurrent insertion inside the deleted range', () => {
		const text = createText( 'Hello big world' );
		// The editor deleted " world" from "Hello world" while a peer added
		// "big " inside the range. The peer's text stays.
		rebaseRichTextUpdate( text, 'Hello world', 'Hello', null );
		expect( text.toString() ).toBe( 'Hellobig ' );
	} );

	it( 'does not revert formatting a peer applied elsewhere in the text', () => {
		const text = createText( '<strong>Hello</strong> world' );
		rebaseRichTextUpdate( text, 'Hello world', 'Hello world!', null );
		expect( text.toString() ).toBe( '<strong>Hello</strong> world!' );
	} );
} );
