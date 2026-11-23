import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import {
	BLOCK_EXCERPT_MAX_CHARS,
	PAYLOAD_MAX_BYTES,
	blockExcerpt,
	buildSuggestionPayload,
	payloadByteLength,
	structuralOpFromMarker,
	structuralOperationText,
} from '../operations';

const PARAGRAPH = 'test/excerpt-paragraph';
const GROUP = 'test/excerpt-group';

const paragraph = ( clientId: string, content: unknown ) => ( {
	clientId,
	name: PARAGRAPH,
	attributes: { content },
	innerBlocks: [],
} );

function treeOf( block: any ) {
	return {
		getBlock: () => block,
		getBlockName: () => block.name,
		getBlockRootClientId: () => '',
		getBlockOrder: () => [ block.clientId ],
		getBlockAttributes: () => block.attributes,
	} as any;
}

beforeAll( () => {
	registerBlockType( PARAGRAPH, {
		apiVersion: 3,
		title: 'Excerpt paragraph',
		category: 'text',
		attributes: {
			content: { type: 'rich-text', source: 'rich-text' },
			metadata: { type: 'object' },
		},
		save: () => null,
	} );
	registerBlockType( GROUP, {
		apiVersion: 3,
		title: 'Excerpt group',
		category: 'design',
		attributes: { metadata: { type: 'object' } },
		save: () => null,
	} );
} );

afterAll( () => {
	unregisterBlockType( PARAGRAPH );
	unregisterBlockType( GROUP );
} );

describe( 'blockExcerpt', () => {
	it( 'is the text of the block on one line, without markup', () => {
		expect(
			blockExcerpt(
				paragraph(
					'a',
					'Hello <strong>there</strong>,\n  <mark class="wp-suggestion-add" data-suggestion-id="4" data-suggestion-type="add">world</mark>'
				)
			)
		).toEqual( { excerpt: 'Hello there, world' } );
		expect(
			blockExcerpt(
				paragraph( 'a', RichTextData.fromPlainText( 'Rich text' ) )
			)
		).toEqual( { excerpt: 'Rich text' } );
	} );

	it( 'is absent for a block with no text', () => {
		expect( blockExcerpt( paragraph( 'a', '' ) ) ).toEqual( {} );
		expect(
			blockExcerpt( {
				name: GROUP,
				attributes: {},
			} )
		).toEqual( {} );
		expect( blockExcerpt( null ) ).toEqual( {} );
	} );

	it( 'is cut to the limit with an ellipsis', () => {
		const { excerpt } = blockExcerpt(
			paragraph( 'a', 'word '.repeat( 200 ) )
		);
		expect( Array.from( excerpt as string ) ).toHaveLength(
			BLOCK_EXCERPT_MAX_CHARS
		);
		expect( excerpt?.endsWith( 'word word…' ) ).toBe( true );
	} );

	it( 'never cuts through a surrogate pair', () => {
		const { excerpt } = blockExcerpt(
			paragraph( 'a', '😀'.repeat( BLOCK_EXCERPT_MAX_CHARS + 5 ) )
		);
		expect( Array.from( excerpt as string ) ).toHaveLength(
			BLOCK_EXCERPT_MAX_CHARS
		);
		// A lone surrogate does not survive a UTF-8 round trip.
		expect(
			new TextDecoder().decode(
				new TextEncoder().encode( excerpt as string )
			)
		).toBe( excerpt );
	} );
} );

describe( 'structural operations of a large block', () => {
	// A section far larger than a payload may be.
	const large = {
		clientId: 'section',
		name: GROUP,
		attributes: {},
		innerBlocks: Array.from( { length: 400 }, ( _unused, index ) =>
			paragraph(
				`p${ index }`,
				'Lorem ipsum dolor sit amet. '.repeat( 10 )
			)
		),
	};
	const longParagraph = paragraph(
		'long',
		'Lorem ipsum dolor sit amet. '.repeat( 4000 )
	);

	it.each( [
		[ 'pending-remove', large ],
		[ 'pending-insert', large ],
		[ 'pending-remove', longParagraph ],
		[ 'pending-insert', longParagraph ],
	] as const )( 'fits the payload for %s', ( type, block ) => {
		expect( JSON.stringify( block ).length ).toBeGreaterThan(
			PAYLOAD_MAX_BYTES
		);
		const op = structuralOpFromMarker(
			block.clientId,
			{ type },
			treeOf( block )
		);
		expect( op ).not.toBeNull();
		expect( op ).not.toHaveProperty( 'block' );
		expect(
			payloadByteLength(
				buildSuggestionPayload( {
					blockName: block.name,
					baseRevision: null,
					operations: [ op as NonNullable< typeof op > ],
				} )
			)
		).toBeLessThan( 2048 );
	} );

	it( 'keeps the start of the text as the excerpt', () => {
		const op = structuralOpFromMarker(
			'long',
			{ type: 'pending-remove' },
			treeOf( longParagraph )
		);
		expect( op?.excerpt.startsWith( 'Lorem ipsum dolor sit amet.' ) ).toBe(
			true
		);
		expect( op?.blockName ).toBe( PARAGRAPH );
	} );
} );

describe( 'structuralOperationText', () => {
	const op = ( extra: Record< string, unknown > ) => ( {
		type: 'block-remove',
		blockName: PARAGRAPH,
		...extra,
	} );

	it( 'prefers the live block', () => {
		expect(
			structuralOperationText( op( { excerpt: 'Stored' } ), {
				content: 'Live text',
			} )
		).toBe( 'Live text' );
		// A live block with no text has none, whatever was stored.
		expect(
			structuralOperationText( op( { excerpt: 'Stored' } ), {
				content: '',
			} )
		).toBeNull();
	} );

	it( 'reads the excerpt once the block is gone', () => {
		expect(
			structuralOperationText( op( { excerpt: 'Stored' } ), null )
		).toBe( 'Stored' );
	} );

	it( 'reads the block an older payload carried', () => {
		expect(
			structuralOperationText(
				op( {
					block: paragraph( 'old', 'From the <em>snapshot</em>' ),
				} ),
				null
			)
		).toBe( 'From the snapshot' );
	} );

	it( 'has no text for a payload with neither', () => {
		expect( structuralOperationText( op( {} ), null ) ).toBeNull();
		expect(
			structuralOperationText( op( { excerpt: 42 } ), null )
		).toBeNull();
	} );
} );
