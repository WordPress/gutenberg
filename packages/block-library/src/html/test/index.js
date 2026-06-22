/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';

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
} );
