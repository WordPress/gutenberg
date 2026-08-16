import { parse } from '@wordpress/block-serialization-default-parser';
import { serializeNode } from '../serialize-node';

/* Round-trips markup through the parser and back, which is the property the
   SSR fallback depends on: what it posts must resolve to the same block. */
function roundTrip( markup: string ): string {
	return parse( markup ).map( serializeNode ).join( '' );
}

describe( 'serializeNode', () => {
	it( 'round-trips a leaf block', () => {
		const markup = '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->';

		expect( roundTrip( markup ) ).toBe( markup );
	} );

	it( 'round-trips a block with attributes', () => {
		const markup =
			'<!-- wp:heading {"level":3} --><h3>Hi</h3><!-- /wp:heading -->';

		expect( roundTrip( markup ) ).toBe( markup );
	} );

	it( 'round-trips a void block', () => {
		const markup = '<!-- wp:spacer {"height":"20px"} /-->';

		expect( roundTrip( markup ) ).toBe( markup );
	} );

	it( 'round-trips nested blocks, not only leaves', () => {
		const markup =
			'<!-- wp:group --><div class="wp-block-group">' +
			'<!-- wp:paragraph --><p>Inner</p><!-- /wp:paragraph -->' +
			'</div><!-- /wp:group -->';

		expect( roundTrip( markup ) ).toBe( markup );
	} );

	it( 'keeps a third-party namespace, and strips only `core/`', () => {
		const markup = '<!-- wp:acme/card --><div /><!-- /wp:acme/card -->';

		expect( roundTrip( markup ) ).toBe( markup );
	} );

	it( 'returns freeform content unchanged', () => {
		const [ node ] = parse( 'just text' );

		expect( serializeNode( node ) ).toBe( 'just text' );
	} );
} );
