/**
 * WordPress dependences
 */
import { registerCoreBlocks } from '@wordpress/core-blocks';

/**
 * Internal dependencies
 */
import segmentHTMLToShortcodeBlock from '../shortcode-converter';
import { createBlock } from '../../factory';

describe( 'segmentHTMLToShortcodeBlock', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	it( 'should convert a standalone shortcode between two paragraphs', () => {
		const original = `<p>Foo</p>

[foo bar="apple"]

<p>Bar</p>`;
		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		expect( transformed ).toHaveLength( 3 );
		expect( transformed[ 0 ] ).toBe( `<p>Foo</p>

` );
		const expectedBlock = createBlock( 'core/shortcode', {
			text: '[foo bar="apple"]',
		} );
		// uuid will always be random.
		expectedBlock.uid = transformed[ 1 ].uid;
		expect( transformed[ 1 ] ).toEqual( expectedBlock );
		expect( transformed[ 2 ] ).toBe( `

<p>Bar</p>` );
	} );
} );
