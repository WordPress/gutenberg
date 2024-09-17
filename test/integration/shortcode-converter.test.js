/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock, registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import segmentHTMLToShortcodeBlock from '../../packages/blocks/src/api/raw-handling/shortcode-converter';

describe( 'segmentHTMLToShortcodeBlock', () => {
	beforeAll( () => {
		registerCoreBlocks();
		registerBlockType( 'test/gallery', {
			title: 'Test Gallery',
			category: 'text',
			attributes: {
				ids: {
					type: 'array',
					default: [],
				},
			},
			transforms: {
				from: [
					{
						type: 'shortcode',
						tag: [ 'my-gallery', 'my-bunch-of-images' ],
						attributes: {
							ids: {
								type: 'array',
								shortcode: ( { named: { ids } } ) =>
									ids
										.split( ',' )
										.map( ( id ) => parseInt( id, 10 ) ),
							},
						},
					},
				],
			},
			save: () => null,
		} );
		registerBlockType( 'test/broccoli', {
			title: 'Test Broccoli',
			category: 'text',
			attributes: {
				id: {
					type: 'number',
				},
			},
			transforms: {
				from: [
					{
						type: 'shortcode',
						tag: [ 'my-broccoli' ],
						attributes: {
							id: {
								type: 'number',
								shortcode: ( { named: { id } } ) =>
									parseInt( id, 10 ),
							},
						},
						isMatch( { named: { id } } ) {
							return id < 1000;
						},
					},
				],
			},
			save: () => null,
		} );
		registerBlockType( 'test/fallback-broccoli', {
			title: 'Test Fallback Broccoli',
			category: 'text',
			attributes: {
				id: {
					type: 'number',
				},
			},
			transforms: {
				from: [
					{
						type: 'shortcode',
						tag: [ 'my-broccoli' ],
						attributes: {
							id: {
								type: 'number',
								shortcode: ( { named: { id } } ) =>
									parseInt( id, 10 ),
							},
						},
						isMatch( { named: { id } } ) {
							return id > 1000;
						},
					},
				],
			},
			save: () => null,
		} );
	} );

	it( 'should convert a standalone shortcode between two paragraphs', () => {
		const original = `<p>Foo</p>

[foo bar="apple"]

<p>Bar</p>`;
		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		expect( transformed ).toHaveLength( 3 );
		expect( transformed[ 0 ] ).toBe( `<p>Foo</p>` );
		const expectedBlock = createBlock( 'core/shortcode', {
			text: '[foo bar="apple"]',
		} );
		// clientId will always be random.
		expectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( expectedBlock );
		expect( transformed[ 2 ] ).toBe( `<p>Bar</p>` );
	} );

	it( 'should convert a shortcode to a block type with a passing `isMatch`', () => {
		const original = `<p>[my-broccoli id="42"]</p>`;

		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		const expectedBlock = createBlock( 'test/broccoli', { id: 42 } );
		expectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( expectedBlock );
	} );

	it( 'should not convert a shortcode to a block type with a failing `isMatch`', () => {
		const original = `<p>[my-broccoli id="1000"]</p>`;
		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		const expectedBlock = createBlock( 'core/shortcode', {
			text: '[my-broccoli id="1000"]',
		} );
		expectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( expectedBlock );
	} );

	it( 'should not blindly exclude a transform in subsequent shortcodes after a failed `isMatch`', () => {
		const original = `<p>[my-broccoli id="1001"]</p>
		<p>[my-broccoli id="42"]</p>
		<p>[my-broccoli id="1000"]</p>`;

		const transformed = segmentHTMLToShortcodeBlock( original );
		const firstExpectedBlock = createBlock( 'test/fallback-broccoli', {
			id: 1001,
		} );
		firstExpectedBlock.clientId = transformed[ 1 ].clientId;
		const secondExpectedBlock = createBlock( 'test/broccoli', { id: 42 } );
		secondExpectedBlock.clientId = transformed[ 3 ].clientId;
		const thirdExpectedBlock = createBlock( 'core/shortcode', {
			text: '[my-broccoli id="1000"]',
		} );
		thirdExpectedBlock.clientId = transformed[ 5 ].clientId;
		expect( transformed[ 1 ] ).toEqual( firstExpectedBlock );
		expect( transformed[ 3 ] ).toEqual( secondExpectedBlock );
		expect( transformed[ 5 ] ).toEqual( thirdExpectedBlock );
	} );

	it( 'should convert two instances of the same shortcode', () => {
		const original = `<p>[foo one]</p>
<p>[foo two]</p>`;

		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		expect( transformed[ 0 ] ).toEqual( '' );
		const firstExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo one]',
		} );
		// clientId will always be random.
		firstExpectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( firstExpectedBlock );
		expect( transformed[ 2 ] ).toEqual( `
` );
		const secondExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo two]',
		} );
		// clientId will always be random.
		secondExpectedBlock.clientId = transformed[ 3 ].clientId;
		expect( transformed[ 3 ] ).toEqual( secondExpectedBlock );
		expect( transformed[ 4 ] ).toEqual( '' );
		expect( transformed ).toHaveLength( 5 );
	} );

	it( 'should convert four instances of the same shortcode', () => {
		const original = `<p>[foo one]</p>
<p>[foo two]</p>
<p>[foo three]</p>
<p>[foo four]</p>`;

		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		expect( transformed[ 0 ] ).toEqual( '' );
		const firstExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo one]',
		} );
		// clientId will always be random.
		firstExpectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( firstExpectedBlock );
		expect( transformed[ 2 ] ).toEqual( `
` );
		const secondExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo two]',
		} );
		// clientId will always be random.
		secondExpectedBlock.clientId = transformed[ 3 ].clientId;
		expect( transformed[ 3 ] ).toEqual( secondExpectedBlock );
		expect( transformed[ 4 ] ).toEqual( `
` );
		const thirdExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo three]',
		} );
		// clientId will always be random.
		thirdExpectedBlock.clientId = transformed[ 5 ].clientId;
		expect( transformed[ 5 ] ).toEqual( thirdExpectedBlock );
		expect( transformed[ 6 ] ).toEqual( `
` );
		const fourthExpectedBlock = createBlock( 'core/shortcode', {
			text: '[foo four]',
		} );
		// clientId will always be random.
		fourthExpectedBlock.clientId = transformed[ 7 ].clientId;
		expect( transformed[ 7 ] ).toEqual( fourthExpectedBlock );
		expect( transformed[ 8 ] ).toEqual( '' );
		expect( transformed ).toHaveLength( 9 );
	} );

	it( 'should not convert inline shortcodes', () => {
		const originalInASentence = `<p>Here is a nice [foo shortcode].</p>`;
		expect( segmentHTMLToShortcodeBlock( originalInASentence, 0 ) ).toEqual(
			[ originalInASentence ]
		);

		const originalMultipleShortcodes = `<p>[foo bar] [baz quux]</p>`;
		expect(
			segmentHTMLToShortcodeBlock( originalMultipleShortcodes, 0 )
		).toEqual( [ originalMultipleShortcodes ] );
	} );

	it( 'should convert regardless of shortcode alias', () => {
		const original = `<p>[my-gallery ids="1,2,3"]</p>
<p>[my-bunch-of-images ids="4,5,6"]</p>`;
		const transformed = segmentHTMLToShortcodeBlock( original, 0 );
		expect( transformed[ 0 ] ).toBe( '' );
		expect( transformed[ 1 ] ).toHaveProperty( 'name', 'test/gallery' );
		expect( transformed[ 2 ] ).toBe( '\n' );
		expect( transformed[ 3 ] ).toHaveProperty( 'name', 'test/gallery' );
		expect( transformed[ 4 ] ).toBe( '' );
	} );

	it( 'should convert regardless of shortcode order', () => {
		const original = `<p>[my-gallery ids="4,5,6"]</p>
<p>[my-broccoli id="42"]</p>`;

		const transformed = segmentHTMLToShortcodeBlock( original, 0 );

		expect( transformed[ 0 ] ).toBe( '' );

		let firstExpectedBlock = createBlock( 'test/gallery', {
			ids: [ 4, 5, 6 ],
		} );
		// clientId will always be random.
		firstExpectedBlock.clientId = transformed[ 1 ].clientId;
		expect( transformed[ 1 ] ).toEqual( firstExpectedBlock );

		expect( transformed[ 2 ] ).toBe( '\n' );

		let secondExpectedBlock = createBlock( 'test/broccoli', { id: 42 } );
		// clientId will always be random.
		secondExpectedBlock.clientId = transformed[ 3 ].clientId;
		expect( transformed[ 3 ] ).toEqual( secondExpectedBlock );

		expect( transformed[ 4 ] ).toBe( '' );
		expect( transformed ).toHaveLength( 5 );

		// Flip the order of the shortcodes.
		const reversed = `<p>[my-broccoli id="42"]</p>
<p>[my-gallery ids="4,5,6"]</p>`;

		const reverseTransformed = segmentHTMLToShortcodeBlock( reversed, 0 );

		expect( reverseTransformed[ 0 ] ).toBe( '' );

		firstExpectedBlock = createBlock( 'test/broccoli', { id: 42 } );
		// clientId will always be random.
		firstExpectedBlock.clientId = reverseTransformed[ 1 ].clientId;
		expect( reverseTransformed[ 1 ] ).toEqual( firstExpectedBlock );

		expect( reverseTransformed[ 2 ] ).toBe( '\n' );

		secondExpectedBlock = createBlock( 'test/gallery', {
			ids: [ 4, 5, 6 ],
		} );
		// clientId will always be random.
		secondExpectedBlock.clientId = reverseTransformed[ 3 ].clientId;
		expect( reverseTransformed[ 3 ] ).toEqual( secondExpectedBlock );

		expect( reverseTransformed[ 4 ] ).toBe( '' );
		expect( reverseTransformed ).toHaveLength( 5 );
	} );
} );
