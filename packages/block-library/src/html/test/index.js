/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	serialize,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import * as html from '../';

describe( 'core/html', () => {
	beforeAll( () => {
		registerBlockType(
			{ name: html.name, ...html.metadata },
			html.settings
		);
	} );

	afterAll( () => {
		unregisterBlockType( html.name );
	} );

	describe( 'deprecated content attribute', () => {
		it( 'preserves content passed to createBlock', () => {
			const block = createBlock( 'core/html', {
				content: '<marquee>Hello</marquee>',
			} );

			// The attribute is kept so it can be migrated rather than dropped.
			expect( block.attributes.content ).toBe(
				'<marquee>Hello</marquee>'
			);
		} );

		it( 'keeps the content attribute out of the block delimiter', () => {
			const block = createBlock( 'core/html', {
				content: '<marquee>Hello</marquee>',
			} );

			// `role: 'local'` prevents the attribute from being written into
			// the comment delimiter as JSON.
			expect( serialize( block ) ).not.toContain( '{"content"' );
		} );
	} );

	describe( 'inner content', () => {
		it( 'serializes from inner content interleaved with inner blocks', () => {
			registerBlockType( 'core/paragraph', {
				apiVersion: 3,
				category: 'text',
				title: 'Paragraph',
				attributes: {
					content: { type: 'string', source: 'html' },
				},
				save: ( { attributes } ) => attributes.content || null,
			} );

			const block = createBlock(
				'core/html',
				{},
				[ createBlock( 'core/paragraph', { content: 'Editable' } ) ],
				[ '<div>', null, '</div>' ]
			);

			expect( serialize( block ) ).toBe(
				'<!-- wp:html -->\n' +
					'<div><!-- wp:paragraph -->\n' +
					'Editable\n' +
					'<!-- /wp:paragraph --></div>\n' +
					'<!-- /wp:html -->'
			);

			unregisterBlockType( 'core/paragraph' );
		} );
	} );

	describe( 'transform from core/code', () => {
		beforeEach( () => {
			registerBlockType( 'core/paragraph', {
				apiVersion: 3,
				category: 'text',
				title: 'Paragraph',
				attributes: {
					content: { type: 'string', source: 'html' },
				},
				save: ( { attributes } ) => attributes.content || null,
			} );
			// A minimal stand-in: the transform only reads `attributes.content`.
			registerBlockType( 'core/code', {
				apiVersion: 3,
				category: 'text',
				title: 'Code',
				attributes: {
					content: { type: 'string', source: 'html' },
				},
				save: ( { attributes } ) => attributes.content || null,
			} );
		} );

		afterEach( () => {
			unregisterBlockType( 'core/code' );
			unregisterBlockType( 'core/paragraph' );
		} );

		// Mirrors how the code block stores HTML-block source: as escaped,
		// plain-text rich text.
		const asCodeContent = ( source ) =>
			toHTMLString( { value: create( { text: source } ) } );

		it( 'restores block delimiters as editable inner blocks', () => {
			const codeBlock = createBlock( 'core/code', {
				content: asCodeContent(
					'<div><!-- wp:paragraph -->\nEditable\n<!-- /wp:paragraph --></div>'
				),
			} );

			const [ htmlBlock ] = switchToBlockType( codeBlock, 'core/html' );

			expect( htmlBlock.name ).toBe( 'core/html' );
			expect( htmlBlock.innerBlocks ).toHaveLength( 1 );
			expect( htmlBlock.innerBlocks[ 0 ].name ).toBe( 'core/paragraph' );
			expect( htmlBlock.innerContent ).toContain( null );
		} );

		it( 'keeps plain code (no delimiters) as a single static fragment', () => {
			const codeBlock = createBlock( 'core/code', {
				content: asCodeContent( '<div>Just static HTML</div>' ),
			} );

			const [ htmlBlock ] = switchToBlockType( codeBlock, 'core/html' );

			expect( htmlBlock.innerBlocks ).toHaveLength( 0 );
			expect( htmlBlock.innerContent ).not.toContain( null );
		} );
	} );
} );
