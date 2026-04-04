import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { parseBlockMarkup, resetParserIds } from '../transports/rest.js';

describe( 'parseBlockMarkup', () => {
	beforeEach( () => {
		resetParserIds();
	} );

	it( 'should parse a self-closing block', () => {
		const blocks = parseBlockMarkup( '<!-- wp:spacer /-->' );
		assert.equal( blocks.length, 1 );
		assert.equal( blocks[ 0 ].name, 'core/spacer' );
		assert.equal( blocks[ 0 ].innerBlocks.length, 0 );
	} );

	it( 'should parse a block with content', () => {
		const blocks = parseBlockMarkup(
			'<!-- wp:paragraph --><p>Hello world</p><!-- /wp:paragraph -->'
		);
		assert.equal( blocks.length, 1 );
		assert.equal( blocks[ 0 ].name, 'core/paragraph' );
	} );

	it( 'should parse JSON attributes', () => {
		const blocks = parseBlockMarkup(
			'<!-- wp:image {"id":42,"sizeSlug":"large"} /-->'
		);
		assert.equal( blocks.length, 1 );
		assert.deepEqual( blocks[ 0 ].attributes, {
			id: 42,
			sizeSlug: 'large',
		} );
	} );

	it( 'should preserve namespaced block names', () => {
		const blocks = parseBlockMarkup(
			'<!-- wp:woocommerce/product-title /-->'
		);
		assert.equal( blocks.length, 1 );
		assert.equal( blocks[ 0 ].name, 'woocommerce/product-title' );
	} );

	it( 'should prefix core blocks without namespace', () => {
		const blocks = parseBlockMarkup( '<!-- wp:heading /-->' );
		assert.equal( blocks[ 0 ].name, 'core/heading' );
	} );

	it( 'should parse nested blocks', () => {
		const markup = `<!-- wp:columns -->
<!-- wp:column -->
<!-- wp:paragraph --><p>Left</p><!-- /wp:paragraph -->
<!-- /wp:column -->
<!-- wp:column -->
<!-- wp:paragraph --><p>Right</p><!-- /wp:paragraph -->
<!-- /wp:column -->
<!-- /wp:columns -->`;

		const blocks = parseBlockMarkup( markup );
		assert.equal( blocks.length, 1 );
		assert.equal( blocks[ 0 ].name, 'core/columns' );
		assert.equal( blocks[ 0 ].innerBlocks.length, 2 );
		assert.equal( blocks[ 0 ].innerBlocks[ 0 ].name, 'core/column' );
		assert.equal( blocks[ 0 ].innerBlocks[ 0 ].innerBlocks.length, 1 );
		assert.equal(
			blocks[ 0 ].innerBlocks[ 0 ].innerBlocks[ 0 ].name,
			'core/paragraph'
		);
	} );

	it( 'should handle nested blocks of the same type', () => {
		const markup = `<!-- wp:group -->
<!-- wp:group -->
<!-- wp:paragraph --><p>Deep</p><!-- /wp:paragraph -->
<!-- /wp:group -->
<!-- /wp:group -->`;

		const blocks = parseBlockMarkup( markup );
		assert.equal( blocks.length, 1 );
		assert.equal( blocks[ 0 ].name, 'core/group' );
		assert.equal( blocks[ 0 ].innerBlocks.length, 1 );
		assert.equal( blocks[ 0 ].innerBlocks[ 0 ].name, 'core/group' );
		assert.equal( blocks[ 0 ].innerBlocks[ 0 ].innerBlocks.length, 1 );
	} );

	it( 'should parse multiple sibling blocks', () => {
		const markup = `<!-- wp:heading --><h2>Title</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Text</p><!-- /wp:paragraph -->
<!-- wp:spacer /-->`;

		const blocks = parseBlockMarkup( markup );
		assert.equal( blocks.length, 3 );
		assert.equal( blocks[ 0 ].name, 'core/heading' );
		assert.equal( blocks[ 1 ].name, 'core/paragraph' );
		assert.equal( blocks[ 2 ].name, 'core/spacer' );
	} );

	it( 'should handle empty markup', () => {
		assert.equal( parseBlockMarkup( '' ).length, 0 );
	} );

	it( 'should handle markup with no blocks', () => {
		assert.equal( parseBlockMarkup( '<p>Plain HTML</p>' ).length, 0 );
	} );

	it( 'should assign unique clientIds', () => {
		const blocks = parseBlockMarkup(
			'<!-- wp:paragraph /--><!-- wp:heading /-->'
		);
		assert.notEqual( blocks[ 0 ].clientId, blocks[ 1 ].clientId );
	} );

	it( 'should handle block with attributes and inner content', () => {
		const markup =
			'<!-- wp:cover {"url":"https://example.com/img.jpg","dimRatio":50} --><div class="wp-block-cover"><p>Overlay text</p></div><!-- /wp:cover -->';
		const blocks = parseBlockMarkup( markup );
		assert.equal( blocks.length, 1 );
		assert.equal( blocks[ 0 ].name, 'core/cover' );
		assert.deepEqual( blocks[ 0 ].attributes, {
			url: 'https://example.com/img.jpg',
			dimRatio: 50,
		} );
	} );
} );
