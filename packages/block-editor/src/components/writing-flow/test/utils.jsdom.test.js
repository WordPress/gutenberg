import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
	__unstableGetInnerBlocksProps as getInnerBlocksProps,
} from '@wordpress/blocks';
import { createElement, RawHTML } from '@wordpress/element';
import { dispatch, select } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import {
	getClipboardBlocksContent,
	requiresWrapperOnCopy,
	setClipboardBlocks,
} from '../utils';

const bindings = {
	content: { source: 'core/post-meta', args: { key: 'movie_field' } },
};
const registry = { select };

function createBoundParagraph( content = '' ) {
	return createBlock( 'core/paragraph', {
		content,
		metadata: { bindings, name: 'Bound paragraph' },
	} );
}

function registerResolvedAttributes( attributesForCopy, block, content ) {
	attributesForCopy.set(
		block.clientId,
		new Map( [
			[
				{},
				{
					attributes: block.attributes,
					computedAttributes: {
						...block.attributes,
						content,
						metadata: { name: 'Resolved metadata' },
					},
					boundAttributeNames: [ 'content' ],
				},
			],
		] )
	);
}

describe( 'block clipboard content', () => {
	beforeAll( () => {
		for ( const [ name, tagName ] of [
			[ 'core/paragraph', 'p' ],
			[ 'core/heading', 'h2' ],
			[ 'core/list-item', 'li' ],
		] ) {
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				category: 'text',
				attributes: {
					metadata: { type: 'object' },
					content: {
						type: 'string',
						source: 'html',
						selector: tagName,
						default: '',
					},
				},
				...( name === 'core/list-item'
					? { [ requiresWrapperOnCopy ]: true }
					: {} ),
				save: ( { attributes } ) =>
					createElement(
						tagName,
						null,
						createElement( RawHTML, null, attributes.content )
					),
			} );
		}
		for ( const [ name, tagName ] of [
			[ 'core/group', 'div' ],
			[ 'core/list', 'ul' ],
		] ) {
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				category: 'text',
				save: () => createElement( tagName, getInnerBlocksProps() ),
			} );
		}
	} );

	afterAll( () => {
		for ( const name of [
			'core/paragraph',
			'core/heading',
			'core/group',
			'core/list',
			'core/list-item',
		] ) {
			unregisterBlockType( name );
		}
	} );

	it( 'copies bound text and formatting as valid block HTML without changing the source', () => {
		const block = createBoundParagraph();
		const attributesForCopy = new Map();
		registerResolvedAttributes(
			attributesForCopy,
			block,
			'Bound <strong>text</strong>'
		);
		const originalHTML = serialize( [ block ] );
		Object.freeze( block.attributes );
		Object.freeze( block );

		const { html, plainText, hasBoundAttributes } =
			getClipboardBlocksContent( [ block ], registry, attributesForCopy );

		expect( plainText ).toBe( 'Bound text' );
		expect( html ).toContain( '<p>Bound <strong>text</strong></p>' );
		expect( hasBoundAttributes ).toBe( true );
		const [ pastedBlock ] = parse( html );
		expect( pastedBlock.isValid ).toBe( true );
		expect( pastedBlock.attributes ).toEqual( {
			content: 'Bound <strong>text</strong>',
			metadata: block.attributes.metadata,
		} );
		expect( block.attributes.content ).toBe( '' );
		expect( block.attributes.metadata.bindings ).toBe( bindings );
		expect( serialize( [ block ] ) ).toBe( originalHTML );
	} );

	it( 'resolves nested blocks in a mixed selection', () => {
		const nestedBoundBlock = createBoundParagraph();
		const unboundBlock = createBlock( 'core/paragraph', {
			content: 'Normal paragraph',
		} );
		const group = createBlock( 'core/group', {}, [
			nestedBoundBlock,
			unboundBlock,
		] );
		const heading = createBlock( 'core/heading', { content: 'Heading' } );
		const attributesForCopy = new Map();
		registerResolvedAttributes(
			attributesForCopy,
			nestedBoundBlock,
			'Bound text'
		);
		const originalHTML = serialize( [ group, heading ] );

		const { html, plainText } = getClipboardBlocksContent(
			[ group, heading ],
			registry,
			attributesForCopy
		);

		expect( plainText ).toBe( 'Bound text\n\nNormal paragraph\n\nHeading' );
		const pastedBlocks = parse( html );
		expect( pastedBlocks[ 0 ].innerBlocks ).toMatchObject( [
			{
				attributes: {
					content: 'Bound text',
					metadata: { bindings },
				},
				isValid: true,
			},
			{ attributes: { content: 'Normal paragraph' }, isValid: true },
		] );
		expect( pastedBlocks[ 1 ] ).toMatchObject( {
			name: 'core/heading',
			isValid: true,
		} );
		expect( group.innerBlocks[ 0 ] ).toBe( nestedBoundBlock );
		expect( serialize( [ group, heading ] ) ).toBe( originalHTML );
	} );

	it( 'does not replace partial head and tail content with their whole bound values', () => {
		const head = createBoundParagraph( 'Head fallback' );
		const middle = createBoundParagraph();
		const tail = createBoundParagraph( 'Tail fallback' );
		const attributesForCopy = new Map();
		for ( const [ block, content ] of [
			[ head, 'Whole head' ],
			[ middle, 'Resolved middle' ],
			[ tail, 'Whole tail' ],
		] ) {
			registerResolvedAttributes( attributesForCopy, block, content );
		}
		const partialBlocks = [
			{ ...head, attributes: { ...head.attributes, content: 'head' } },
			middle,
			{ ...tail, attributes: { ...tail.attributes, content: 'tail' } },
		];

		const { html, plainText } = getClipboardBlocksContent(
			partialBlocks,
			registry,
			attributesForCopy
		);

		expect( plainText ).toBe( 'head\n\nResolved middle\n\ntail' );
		expect(
			parse( html ).map( ( block ) => block.attributes.content )
		).toEqual( [ 'head', 'Resolved middle', 'tail' ] );
	} );

	it( 'keeps the original serialized HTML for blocks without a resolved binding', () => {
		const blocks = [
			createBlock( 'core/heading', { content: 'Heading' } ),
			createBoundParagraph( 'Saved fallback' ),
		];

		expect(
			getClipboardBlocksContent( blocks, registry, new Map() )
		).toEqual( {
			html: serialize( blocks ),
			plainText: 'Heading\n\nSaved fallback',
			hasBoundAttributes: false,
		} );
	} );

	it( 'preserves the parent wrapper when setting clipboard data for a list item', () => {
		const item = createBlock( 'core/list-item', { content: 'List item' } );
		const list = createBlock( 'core/list', {}, [ item ] );
		dispatch( blockEditorStore ).resetBlocks( [ list ] );
		const clipboardContent = new Map();
		const clipboardData = {
			setData: ( type, value ) => clipboardContent.set( type, value ),
		};

		setClipboardBlocks( { clipboardData }, [ item ], registry, new Map() );

		const [ pastedBlock ] = parse( clipboardContent.get( 'text/html' ) );
		expect( pastedBlock ).toMatchObject( {
			name: 'core/list',
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: 'List item' },
				},
			],
			isValid: true,
		} );
		expect( clipboardContent.get( 'text/plain' ) ).toBe( 'List item' );
		expect(
			parse(
				getClipboardBlocksContent( [ item ], registry, new Map() ).html
			)[ 0 ].name
		).toBe( 'core/list-item' );
	} );

	it( 'sets both clipboard formats from the same resolved block content', () => {
		const block = createBoundParagraph();
		const attributesForCopy = new Map();
		registerResolvedAttributes(
			attributesForCopy,
			block,
			'Bound <em>text</em>'
		);
		const clipboardContent = new Map();
		const clipboardData = {
			setData: ( type, value ) => clipboardContent.set( type, value ),
		};

		setClipboardBlocks(
			{ clipboardData },
			[ block ],
			registry,
			attributesForCopy
		);

		expect( clipboardContent.get( 'text/plain' ) ).toBe( 'Bound text' );
		expect( clipboardContent.get( 'text/html' ) ).toContain(
			'<p>Bound <em>text</em></p>'
		);
		expect( block.attributes.content ).toBe( '' );
	} );
} );
