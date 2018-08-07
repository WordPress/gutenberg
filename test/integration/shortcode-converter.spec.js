/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/core-blocks';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import segmentHTMLToShortcodeBlock from '../../packages/blocks/src/api/raw-handling/shortcode-converter';

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
		// clientId will always be random.
		expectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( expectedBlock );
		expect( transformed[ 2 ] ).toBe( `

<p>Bar</p>` );
	} );

	it( 'should convert two instances of the same shortcode', () => {
		const original = `<p>[foo one]</p>
<p>[foo two]</p>`;

		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		expect( transformed[ 0 ] ).toEqual( '<p>' );
		const firstExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo one]',
		} );
		// clientId will always be random.
		firstExpectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( firstExpectedBlock );
		expect( transformed[ 2 ] ).toEqual( `</p>
<p>` );
		const secondExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo two]',
		} );
		// clientId will always be random.
		secondExpectedBlock.clientId = transformed[ 3 ].clientId;
		expect( transformed[ 3 ] ).toEqual( secondExpectedBlock );
		expect( transformed[ 4 ] ).toEqual( '</p>' );
		expect( transformed ).toHaveLength( 5 );
	} );

	it( 'should convert four instances of the same shortcode', () => {
		const original = `<p>[foo one]</p>
<p>[foo two]</p>
<p>[foo three]</p>
<p>[foo four]</p>`;

		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		expect( transformed[ 0 ] ).toEqual( '<p>' );
		const firstExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo one]',
		} );
		// clientId will always be random.
		firstExpectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( firstExpectedBlock );
		expect( transformed[ 2 ] ).toEqual( `</p>
<p>` );
		const secondExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo two]',
		} );
		// clientId will always be random.
		secondExpectedBlock.clientId = transformed[ 3 ].clientId;
		expect( transformed[ 3 ] ).toEqual( secondExpectedBlock );
		expect( transformed[ 4 ] ).toEqual( `</p>
<p>` );
		const thirdExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo three]',
		} );
		// clientId will always be random.
		thirdExpectedBlock.clientId = transformed[ 5 ].clientId;
		expect( transformed[ 5 ] ).toEqual( thirdExpectedBlock );
		expect( transformed[ 6 ] ).toEqual( `</p>
<p>` );
		const fourthExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo four]',
		} );
		// clientId will always be random.
		fourthExpectedBlock.clientId = transformed[ 7 ].clientId;
		expect( transformed[ 7 ] ).toEqual( fourthExpectedBlock );
		expect( transformed[ 8 ] ).toEqual( '</p>' );
		expect( transformed ).toHaveLength( 9 );
	} );
} );
